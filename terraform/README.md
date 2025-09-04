# ECOSYSTEMCL.AI Terraform Infrastructure

## Deploy

```bash
cd terraform
terraform init
terraform plan -var-file=environments/dev.tfvars
terraform apply -var-file=environments/dev.tfvars
```

## Get outputs for frontend

```bash
terraform output
```

## Destroy

```bash
terraform destroy -var-file=environments/dev.tfvars
```

## Cost: ~$15/month