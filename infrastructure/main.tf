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

data "terraform_remote_state" "backend" {
  backend = "s3"
  config = {
    bucket = "stines-solutions-state-bucket"
    key    = "backend/terraform.tfstate"
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
    # Trigger on every apply to ensure files are always synced
    always_run = timestamp()
  }

  provisioner "local-exec" {
    command = <<-EOT
      set -e
      echo "Starting website deployment to ${local.bucket_name}..." >&2
      
      if [ ! -d "${path.module}/dist" ]; then
        echo "ERROR: dist directory not found" >&2
        exit 1
      fi
      
      echo "Files in dist:" >&2
      ls -lh "${path.module}/dist" | tail -5 >&2
      
      echo "Syncing to S3..." >&2
      aws s3 sync "${path.module}/dist" "s3://${local.bucket_name}" --delete
      
      echo "Deployment complete!" >&2
    EOT
    interpreter = ["bash", "-c"]
  }

  depends_on = [
    data.terraform_remote_state.infrastructure
  ]
}
