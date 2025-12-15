output "public_ip" {
  value = aws_instance.host.public_ip
}

output "public_dns" {
  value = aws_instance.host.public_dns
}

output "alb_dns_name" {
  value       = try(aws_lb.this[0].dns_name, "")
  description = "ALB DNS name (if enable_alb_tls=true)."
}

output "n8n_url" {
  value       = var.enable_alb_tls ? "https://${var.n8n_subdomain}.${var.domain_name}" : ""
  description = "n8n URL (if enable_alb_tls=true)."
}

output "app_url" {
  value       = var.enable_alb_tls ? "https://${var.app_subdomain}.${var.domain_name}" : ""
  description = "App URL (if enable_alb_tls=true)."
}
