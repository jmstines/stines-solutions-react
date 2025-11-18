provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}

data "aws_caller_identity" "current" {}

resource "aws_s3_bucket" "website" {
  bucket = "stinessolutions.com"
  force_destroy = true

  website {
    index_document = "index.html"
    error_document = "index.html"
  }

  tags = {
    Name        = "Stines Solutions Static Website"
    Environment = "Production"
    Owner       = "Jeffrey Stines"
  }

  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "AES256"
      }
    }
  }
}

resource "aws_s3_object" "website_files" {
  for_each = fileset("${path.module}/dist", "**")

  bucket       = aws_s3_bucket.website.id
  key          = each.value
  source       = "${path.module}/dist/${each.value}"
  etag         = filemd5("${path.module}/dist/${each.value}")

  content_type = lookup(
    {
      html = "text/html"
      css  = "text/css"
      js   = "application/javascript"
      png  = "image/png"
      jpg  = "image/jpeg"
      svg  = "image/svg+xml"
    },
    regex("^.*\\.(.*)$", each.value)[0],
    "application/octet-stream"
  )
}

resource "aws_s3_bucket" "redirect_site" {
  bucket = "www.stinessolutions.com"

  website {
    redirect_all_requests_to = "stinessolutions.com"
  }

  tags = {
    Name        = "Redirect Bucket"
    Environment = "Production"
    Owner       = "Jeffrey Stines"
  }
}

resource "aws_acm_certificate" "cert" {
  provider          = aws.us_east_1
  domain_name       = "stinessolutions.com"
  validation_method = "DNS"

  subject_alternative_names = ["www.stinessolutions.com"]
}

resource "aws_s3_bucket_public_access_block" "website_block" {
  bucket                  = aws_s3_bucket.website.id
  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_cloudfront_origin_access_identity" "oai" {
  comment = "Access Identity for S3 bucket stinessolutions.com"
}

resource "aws_s3_bucket_policy" "website_policy" {
  bucket = aws_s3_bucket.website.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Principal = {
          AWS = aws_cloudfront_origin_access_identity.oai.iam_arn
        }
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.website.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      }
    ]
  })
}

resource "aws_route53_zone" "main" {
  name = "stinessolutions.com"
}

resource "aws_route53_record" "main_site" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "stinessolutions.com"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.website_cdn.domain_name
    zone_id                = aws_cloudfront_distribution.website_cdn.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "redirect_site" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "www.stinessolutions.com"
  type    = "A"
  depends_on = [ aws_cloudfront_distribution.website_cdn ]

  alias {
    name                   = aws_cloudfront_distribution.website_cdn.domain_name
    zone_id                = aws_cloudfront_distribution.website_cdn.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_cloudfront_origin_access_control" "oac" {
  name                              = "S3-OAC"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "website_cdn" {
  origin {
    domain_name = aws_s3_bucket.website.bucket_regional_domain_name
    origin_id   = "S3-origin"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.oai.cloudfront_access_identity_path
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"

  aliases = ["stinessolutions.com", "www.stinessolutions.com"]

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate.cert.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "s3-origin"
    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
  }

  restrictions {
    geo_restriction {
      restriction_type = "whitelist"
      locations        = ["US"]
    }
  }
}