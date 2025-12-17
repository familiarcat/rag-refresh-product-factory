# 💰 Quark's AWS Cost Analysis

*"Rule of Acquisition #3: Never spend more for an acquisition than you have to."*

## Current Infrastructure Costs (us-east-2)

### Monthly Breakdown

| Resource | Specification | Hourly | Monthly |
|----------|--------------|--------|---------|
| EC2 t3.small | 2 vCPU, 2 GB RAM | $0.0208 | $15.18 |
| EBS gp3 40GB | Root volume | - | $3.20 |
| ALB | Load Balancer | $0.0225 | $16.43 |
| ALB LCU | ~10 LCU-hrs/day | $0.008 | ~$2.40 |
| ECR | ~500MB storage | - | $0.05 |
| Route53 | Hosted zone + 2 records | - | $0.90 |
| Data Transfer | ~10GB out | - | $0.90 |

### **Total: ~$39/month** (before free tier)

With AWS Free Tier (first 12 months):
- EC2: 750 hrs t2.micro/month FREE
- ALB: 750 hrs FREE
- Data Transfer: 100GB FREE

**With Free Tier: ~$5-10/month**

---

## Cost Comparison: CI/CD vs Manual

### Scenario A: Manual Terraform Deploy
```
Developer actions per deploy:
1. Run terraform plan (2 min)
2. Run terraform apply (5-10 min)
3. Wait for instance (5 min)
4. Build Docker locally (3 min)
5. Push to ECR (2 min)
6. SSH/SSM to deploy (3 min)
7. Verify deployment (2 min)
────────────────────────────
Total: 22-27 minutes per deploy
```

### Scenario B: Auto CI/CD
```
Developer actions per deploy:
1. git push
────────────────────────────
Total: 10 seconds
```

### Monthly Time Analysis
| Metric | Manual | CI/CD |
|--------|--------|-------|
| Deploys/month | 20 | 20 |
| Time/deploy | 25 min | 0 min |
| Total time | 8.3 hrs | 0 hrs |
| @ $75/hr | $625 | $0 |

**ROI of CI/CD: $625/month in developer time saved**

---

## Optimization Opportunities

### Immediate Savings

1. **Use Spot Instances for dev/staging**
   - t3.small spot: ~$6/month (60% savings)
   - Risk: Can be interrupted (fine for non-prod)

2. **Schedule instance stop during off-hours**
   ```bash
   # Stop 10pm-6am = 8 hours/day savings
   # Monthly savings: $15.18 * (8/24) = $5.06
   ```

3. **Right-size the ALB**
   - If traffic is low, consider direct EC2 access
   - Savings: ~$18/month
   - Tradeoff: No SSL termination at LB

### Medium-term Optimizations

4. **Reserved Instances (1-year)**
   - t3.small reserved: ~$9/month (40% savings)
   - Requires 1-year commitment

5. **Savings Plans**
   - Compute Savings Plan: up to 66% off
   - Flexible across instance types

6. **ARM-based instances**
   - t4g.small: $0.0168/hr (20% cheaper than t3)
   - Requires ARM Docker builds

---

## Cost by Usage Pattern

### Low Usage (Hobby/Demo)
- Keep it simple: t3.small + ALB
- Cost: ~$39/month
- Recommendation: ✅ Current setup is fine

### Medium Usage (Startup/Team)
- Add CloudWatch alarms
- Consider reserved instances
- Cost: ~$25-30/month with optimization

### High Usage (Production)
- Auto-scaling group
- Multi-AZ deployment
- CloudFront CDN
- Cost: $100-500/month depending on traffic

---

## Quark's Verdict

> *"Rule of Acquisition #62: The riskier the road, the greater the profit."*

### Development Phase Strategy

**Smart Approach: Decouple milestones from deployments**

| Activity | What Happens | Cost Impact |
|----------|--------------|-------------|
| Milestone push | Git + Supabase only | $0 |
| Local development | Run locally | $0 |
| Manual deploy | When ready to test prod | ~$0.05/deploy |
| Auto CI/CD | Re-enable for production | ~$0.05/deploy |

**Recommended Workflow:**
```bash
# Development (milestones without deploy)
./scripts/milestone/run_milestone.sh "Feature X complete"

# When ready to test on production
./scripts/deploy-app.sh
# OR
./scripts/milestone/run_milestone.sh "Ready for testing" --deploy
```

### Production Phase Strategy

| Approach | Recommendation |
|----------|----------------|
| Keep EC2 always running | ✅ Developer time > $39/month |
| Use CI/CD auto-deploy | ✅ Re-enable for production releases |
| Batch deployments | ✅ Deploy at milestones, not every commit |
| Run locally only | ❌ No production presence |

**The $39/month buys you:**
- 24/7 production availability
- SSL/HTTPS via ACM (free)
- Professional infrastructure
- Deploy when YOU decide
- Credibility with clients

*"Remember, hu-mon: Time is money. And your time is worth more than $39/month."*

---

## Quick Reference: Cost Commands

```bash
# Check current month AWS costs
aws ce get-cost-and-usage \
  --time-period Start=$(date -v-30d +%Y-%m-%d),End=$(date +%Y-%m-%d) \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --output table

# Get EC2 running hours
aws ec2 describe-instances \
  --query 'Reservations[*].Instances[*].[InstanceId,State.Name,LaunchTime]' \
  --output table
```

---

*Analysis by Quark, Business Consultant*
*"Greed is eternal." — Rule of Acquisition #10*

