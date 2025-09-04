terraform {
  required_version = ">= 1.0"
  
  cloud {
    organization = "ECOSYSTEMGSI"
    workspaces {
      name = "ecosystemclai"
    }
  }
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

module "auth" {
  source = "./modules/auth"
  
  app_name = var.app_name
  environment = var.environment
}

module "data" {
  source = "./modules/data"
  
  app_name = var.app_name
  environment = var.environment
}

module "compute" {
  source = "./modules/compute"
  
  app_name = var.app_name
  environment = var.environment
  user_pool_id = module.auth.user_pool_id
  user_pool_client_id = module.auth.user_pool_client_id
  dynamodb_tables = module.data.table_names
}

module "storage" {
  source = "./modules/storage"
  
  app_name = var.app_name
  environment = var.environment
}