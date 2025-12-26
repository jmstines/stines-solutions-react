provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}

data "aws_caller_identity" "current" {}

terraform {
  backend "s3" {
    bucket         = "stines-solutions-state-bucket"
    key            = "react-website/terraform.tfstate" # unique path for this project
    region         = "us-east-1"
    dynamodb_table = "terraform-locks"          # optional for locking
    encrypt        = true
  }
}

data "terraform_remote_state" "backend" {
  backend = "s3"
  config = {
    bucket = "stines-solutions-state-bucket"
    key    = "infrastructure/terraform.tfstate"
    region = "us-east-1"
  }
}

locals {
  bucket_name        = data.terraform_remote_state.infra.outputs.website_bucket_name
  distribution_id    = data.terraform_remote_state.infra.outputs.cloudfront_distribution_id

  # Content type mapping
  mime_types = {
    html = "text/html"
    css  = "text/css"
    js   = "application/javascript"
    png  = "image/png"
    jpg  = "image/jpeg"
    svg  = "image/svg+xml"
    json = "application/json"
    txt  = "text/plain"
    webp = "image/webp"
    ico  = "image/x-icon"
  }
}

resource "aws_s3_object" "website_files" {
  for_each = fileset("${path.module}/dist", "**")

  bucket       = local.bucket_name
  key          = each.value
  source       = "${path.module}/dist/${each.value}"
  etag         = filemd5("${path.module}/dist/${each.value}")
  
  content_type = lookup(
      local.mime_types,
      regex("^.*\\.([^.]+)$", each.value)[0],
      "application/octet-stream"
    )
}

resource "aws_cloudfront_invalidation" "deploy_invalidation" {
  depends_on = [aws_s3_object.website_files]

  distribution_id = local.distribution_id
  paths           = ["/*"]
}
