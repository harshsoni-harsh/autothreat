# AWS S3 Configuration for SBOM Storage

This document explains how to configure AWS S3 for storing SBOM (Software Bill of Materials) files uploaded through the AutoThreat platform.

## Prerequisites

1. **AWS Account**: You need an AWS account with appropriate permissions
2. **S3 Bucket**: Create an S3 bucket for storing SBOM files
3. **IAM User**: Create an IAM user with S3 permissions

## AWS Setup Steps

### 1. Create S3 Bucket

1. Go to AWS S3 Console
2. Click "Create bucket"
3. Enter a unique bucket name (e.g., `autothreat-sboms`)
4. Choose your preferred region
5. Keep default settings for now
6. Click "Create bucket"

### 2. Create IAM User

1. Go to AWS IAM Console
2. Click "Users" → "Create user"
3. Enter username (e.g., `autothreat-s3-user`)
4. Select "Attach policies directly"
5. Attach the following policy:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:DeleteObject"
            ],
            "Resource": "arn:aws:s3:::autothreat-sboms/*"
        },
        {
            "Effect": "Allow",
            "Action": "s3:ListBucket",
            "Resource": "arn:aws:s3:::autothreat-sboms"
        }
    ]
}
```

6. Click "Create user"
7. Save the Access Key ID and Secret Access Key

### 3. Configure Environment Variables

Add the following environment variables to your `.env` file:

```env
# AWS S3 Configuration
AWS_ACCESS_KEY_ID="your-access-key-id"
AWS_SECRET_ACCESS_KEY="your-secret-access-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET_NAME="autothreat-sboms"
```

## Security Best Practices

### 1. Least Privilege Principle
- Only grant the minimum permissions required
- The IAM policy above only allows S3 operations on the specific bucket

### 2. Environment Variables
- Never commit AWS credentials to version control
- Use environment-specific credentials
- Rotate access keys regularly

### 3. Bucket Security
- Enable versioning if needed
- Configure lifecycle policies for old SBOMs
- Enable server-side encryption
- Set up access logging

## SBOM Storage Structure

SBOMs are stored in S3 with the following structure:
```
sboms/
├── {projectId}/
│   ├── {sbomId}.json
│   └── ...
└── ...
```

Example URL:
```
https://autothreat-sboms.s3.us-east-1.amazonaws.com/sboms/project123/sbom456.json
```

## Troubleshooting

### Common Issues

1. **Access Denied**: Check IAM permissions and bucket policy
2. **Region Mismatch**: Ensure AWS_REGION matches your bucket region
3. **Credentials**: Verify AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY

### Testing S3 Connection

You can test the S3 connection by running the SBOM sync API with a test payload.

## Cost Optimization

- **Storage Classes**: Consider using S3 Standard-IA for older SBOMs
- **Lifecycle Policies**: Automatically move old SBOMs to cheaper storage
- **Deletion**: Implement retention policies for old SBOMs

## Monitoring

- Enable CloudTrail for S3 API calls
- Set up CloudWatch alarms for unusual activity
- Monitor S3 storage costs and usage