############################################
# Optional: ALB + ACM + Route53 (TLS + health)
############################################

variable "enable_alb_tls" {
  type    = bool
  default = true
}

variable "domain_name" {
  type        = string
  description = "Root domain, e.g. pbradygeorgen.com"
}

variable "route53_zone_id" {
  type        = string
  description = "Hosted Zone ID for domain_name"
}

variable "n8n_subdomain" {
  type    = string
  default = "n8n"
}

variable "app_subdomain" {
  type    = string
  default = "app"
}

locals {
  n8n_fqdn = "${var.n8n_subdomain}.${var.domain_name}"
  app_fqdn = "${var.app_subdomain}.${var.domain_name}"
}

# ALB SG (public 80/443)
resource "aws_security_group" "alb" {
  count       = var.enable_alb_tls ? 1 : 0
  name        = "${var.name}-alb-sg"
  description = "Public ALB SG"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# Instance SG: only allow traffic from ALB to app ports when ALB enabled
resource "aws_security_group_rule" "instance_allow_app_from_alb" {
  count                    = var.enable_alb_tls ? 1 : 0
  type                     = "ingress"
  from_port                = 3000
  to_port                  = 3000
  protocol                 = "tcp"
  security_group_id        = aws_security_group.host.id
  source_security_group_id = aws_security_group.alb[0].id
  description              = "Allow app traffic from ALB"
}

resource "aws_security_group_rule" "instance_allow_n8n_from_alb" {
  count                    = var.enable_alb_tls ? 1 : 0
  type                     = "ingress"
  from_port                = 5678
  to_port                  = 5678
  protocol                 = "tcp"
  security_group_id        = aws_security_group.host.id
  source_security_group_id = aws_security_group.alb[0].id
  description              = "Allow n8n traffic from ALB"
}

# ACM certificate + DNS validation
resource "aws_acm_certificate" "cert" {
  count             = var.enable_alb_tls ? 1 : 0
  domain_name       = var.domain_name
  validation_method = "DNS"

  subject_alternative_names = [
    local.n8n_fqdn,
    local.app_fqdn
  ]

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_route53_record" "cert_validation" {
  for_each = var.enable_alb_tls ? {
    for dvo in aws_acm_certificate.cert[0].domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  } : {}

  zone_id = var.route53_zone_id
  name    = each.value.name
  type    = each.value.type
  records = [each.value.record]
  ttl     = 60
}

resource "aws_acm_certificate_validation" "cert" {
  count                   = var.enable_alb_tls ? 1 : 0
  certificate_arn         = aws_acm_certificate.cert[0].arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
}

# ALB + target groups
resource "aws_lb" "this" {
  count              = var.enable_alb_tls ? 1 : 0
  name               = "${var.name}-alb"
  load_balancer_type = "application"
  subnets            = data.aws_subnets.default.ids
  security_groups    = [aws_security_group.alb[0].id]
}

resource "aws_lb_target_group" "app" {
  count       = var.enable_alb_tls ? 1 : 0
  name        = "${var.name}-tg-app"
  port        = 3000
  protocol    = "HTTP"
  vpc_id      = data.aws_vpc.default.id
  target_type = "instance"

  health_check {
    path                = "/"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    interval            = 15
    timeout             = 5
    matcher             = "200-399"
  }
}

resource "aws_lb_target_group" "n8n" {
  count       = var.enable_alb_tls ? 1 : 0
  name        = "${var.name}-tg-n8n"
  port        = 5678
  protocol    = "HTTP"
  vpc_id      = data.aws_vpc.default.id
  target_type = "instance"

  health_check {
    path                = "/healthz/readiness"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    interval            = 15
    timeout             = 5
    matcher             = "200-399"
  }
}

resource "aws_lb_target_group_attachment" "app" {
  count            = var.enable_alb_tls ? 1 : 0
  target_group_arn = aws_lb_target_group.app[0].arn
  target_id        = aws_instance.host.id
  port             = 3000
}

resource "aws_lb_target_group_attachment" "n8n" {
  count            = var.enable_alb_tls ? 1 : 0
  target_group_arn = aws_lb_target_group.n8n[0].arn
  target_id        = aws_instance.host.id
  port             = 5678
}

# HTTP listener redirects to HTTPS
resource "aws_lb_listener" "http" {
  count             = var.enable_alb_tls ? 1 : 0
  load_balancer_arn = aws_lb.this[0].arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type = "redirect"
    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

# HTTPS listener with host-based routing
resource "aws_lb_listener" "https" {
  count             = var.enable_alb_tls ? 1 : 0
  load_balancer_arn = aws_lb.this[0].arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = aws_acm_certificate_validation.cert[0].certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app[0].arn
  }
}

resource "aws_lb_listener_rule" "n8n_host" {
  count        = var.enable_alb_tls ? 1 : 0
  listener_arn = aws_lb_listener.https[0].arn
  priority     = 10

  condition {
    host_header {
      values = [local.n8n_fqdn]
    }
  }

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.n8n[0].arn
  }
}

resource "aws_lb_listener_rule" "app_host" {
  count        = var.enable_alb_tls ? 1 : 0
  listener_arn = aws_lb_listener.https[0].arn
  priority     = 20

  condition {
    host_header {
      values = [local.app_fqdn]
    }
  }

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app[0].arn
  }
}

# Route53 aliases
resource "aws_route53_record" "n8n_alias" {
  count   = var.enable_alb_tls ? 1 : 0
  zone_id = var.route53_zone_id
  name    = local.n8n_fqdn
  type    = "A"

  alias {
    name                   = aws_lb.this[0].dns_name
    zone_id                = aws_lb.this[0].zone_id
    evaluate_target_health = true
  }
}

resource "aws_route53_record" "app_alias" {
  count   = var.enable_alb_tls ? 1 : 0
  zone_id = var.route53_zone_id
  name    = local.app_fqdn
  type    = "A"

  alias {
    name                   = aws_lb.this[0].dns_name
    zone_id                = aws_lb.this[0].zone_id
    evaluate_target_health = true
  }
}
