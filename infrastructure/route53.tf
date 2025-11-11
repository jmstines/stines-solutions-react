

# resource "aws_cloudfront_distribution" "cdn" {
#   origin {
#     domain_name = aws_s3_bucket.redirect_site.website_endpoint
#     origin_id   = "S3-main-site"

#     custom_origin_config {
#       origin_protocol_policy = "http-only"
#       http_port              = 80
#       https_port             = 443
#       origin_ssl_protocols   = ["TLSv1.2"]
#     }
#   }

#   enabled             = true
#   is_ipv6_enabled     = true
#   default_root_object = "index.html"

#   aliases = ["stinessolutions.com", "www.stinessolutions.com"]

#   viewer_certificate {
#     acm_certificate_arn            = aws_acm_certificate.cert.arn
#     ssl_support_method             = "sni-only"
#     minimum_protocol_version       = "TLSv1.2_2021"
#   }

#   default_cache_behavior {
#     allowed_methods  = ["GET", "HEAD"]
#     cached_methods   = ["GET", "HEAD"]
#     target_origin_id = "S3-main-site"

#     forwarded_values {
#       query_string = false
#       cookies {
#         forward = "none"
#       }
#     }

#     viewer_protocol_policy = "redirect-to-https"
#   }

#   restrictions {
#     geo_restriction {
#       restriction_type = "none"
#     }
#   }
# }