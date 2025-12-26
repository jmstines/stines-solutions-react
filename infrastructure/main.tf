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

data "terraform_remote_state" "infrastructure" {
  backend = "s3"
  config = {
    bucket = "stines-solutions-state-bucket"
    key    = "infrastructure/terraform.tfstate"
    region = "us-east-1"
  }
}

locals {
  bucket_name     = data.terraform_remote_state.infrastructure.outputs.website_bucket_name
  distribution_id = data.terraform_remote_state.infrastructure.outputs.cloudfront_distribution_id

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

# Deploy website files using AWS CLI instead of Terraform's fileset
# This avoids the performance issue of scanning all files during terraform plan
resource "null_resource" "website_deployment" {
  triggers = {
    # Trigger redeployment on any .ts, .tsx, .css, or package.json change
    # This is much faster than scanning the entire dist directory
    source_files = try(
      filemd5sha256("${path.module}/src"),
      "init"
    )
  }

  provisioner "local-exec" {
    command = <<-EOT
      # Build the website if not already built
      if [ ! -d "${path.module}/dist" ]; then
        cd "${path.module}" && npm run build
      fi
      
      # Sync files to S3
      aws s3 sync "${path.module}/dist" "s3://${local.bucket_name}" --delete
      
      # Invalidate CloudFront cache
      aws cloudfront create-invalidation --distribution-id "${local.distribution_id}" --paths "/*"
    EOT
    interpreter = ["bash", "-c"]
  }

  depends_on = [
    data.terraform_remote_state.infrastructure
  ]
}
