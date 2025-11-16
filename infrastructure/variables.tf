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

variable "acm_certificate_arn" {
  description = "ARN of ACM certificate in us-east-1"
}
