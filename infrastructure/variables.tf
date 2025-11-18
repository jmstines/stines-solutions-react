# variable "bucket_name" {}

# variable "acl_value" {
#     default = "private"
# }

# variable "aws_access_key" {
#     default = “<your_access_key>”
# }

# variable "aws_secret_key" {
#     default = “<your_secret_key>”
# }

# variable "region" {
#     default = "region"
# }


# variable "route53_zone_id" {
#   description = "The Route 53 Hosted Zone ID for stinessolutions.com"
#   type        = string
# }

# output "cloudfront_domain" {
#   value = aws_cloudfront_distribution.cdn.domain_name
# }

# variable "acm_certificate_arn" {
#   type = string
#   validation {
#     condition     = can(regex("^arn:aws:acm:us-east-1:[0-9]{12}:certificate/", var.acm_certificate_arn))
#     error_message = "The ACM certificate ARN must be in us-east-1 and follow the correct format."
#   }
# }