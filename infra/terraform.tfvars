# RAG Refresh Product Factory - Terraform Configuration
# Generated: 2025-12-16

# AWS Region
aws_region = "us-east-2"

# EC2 Configuration
key_name       = "AlexKeyPair"
instance_type  = "t3.small"
root_volume_gb = 40

# Security - SSH access
allowed_ssh_cidrs = ["0.0.0.0/0"]  # TODO: Restrict to your IP for production

# Resource naming (keep short for AWS limits)
name = "rag-refresh"

# TLS/Domain Configuration
enable_alb_tls  = true
domain_name     = "pbradygeorgen.com"
route53_zone_id = "Z0759101F61W3MIFHSWK"

# Subdomains
app_subdomain = "rag"
n8n_subdomain = "n8n"

# Disable alarms until CloudWatch permissions are added
enable_alarms = false

