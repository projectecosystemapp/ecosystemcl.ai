output "table_names" {
  value = {
    user_profile       = aws_dynamodb_table.user_profile.name
    workspace         = aws_dynamodb_table.workspace.name
    plan              = aws_dynamodb_table.plan.name
    api_key           = aws_dynamodb_table.api_key.name
    subscription_event = aws_dynamodb_table.subscription_event.name
  }
}