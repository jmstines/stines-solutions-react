output "website_bucket_name" {
  description = "Name of the S3 bucket hosting the website"
  value       = local.bucket_name
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID for the website"
  value       = local.distribution_id
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = data.terraform_remote_state.infrastructure.outputs.cloudfront_domain_name
}

output "api_gateway_url" {
  description = "API Gateway URL for the contact form"
  value       = data.terraform_remote_state.infrastructure.outputs.api_gateway_url
}
