variable "aws_region" { type = string }

variable "instance_type" {
  type    = string
  default = "t3.small"
}

variable "key_name" {
  type        = string
  description = "Existing EC2 keypair name."
}

variable "allowed_ssh_cidrs" {
  type        = list(string)
  default     = ["0.0.0.0/0"]
  description = "CIDRs allowed to SSH (22). Replace with your IP(s) for safety."
}

variable "name" {
  type    = string
  default = "rag-refresh-docker-host"
}

variable "root_volume_gb" {
  type    = number
  default = 40
}
