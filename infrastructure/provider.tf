terraform {
  required_providers {
    null = {
      source = "hashicorp/null"
    }
  }
}

provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}

provider "aws" {
  region = "us-east-1"
}
