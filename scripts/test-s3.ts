import { s3Service } from '@/lib/s3'

async function testS3Connection() {
    console.log('🧪 Testing AWS S3 Configuration...\n')

    try {
        // Check if S3 is configured
        if (!s3Service.isConfigured()) {
            console.log('❌ AWS S3 is not configured.')
            console.log('Please set the following environment variables:')
            console.log('  - AWS_ACCESS_KEY_ID')
            console.log('  - AWS_SECRET_ACCESS_KEY')
            console.log('  - AWS_REGION (optional, defaults to us-east-1)')
            console.log('  - AWS_S3_BUCKET_NAME (optional, defaults to autothreat-sboms)')
            process.exit(1)
        }

        console.log('✅ AWS S3 is configured')

        // Test upload with a small test file
        const testData = {
            test: true,
            timestamp: new Date().toISOString(),
            message: 'S3 configuration test'
        }

        console.log('📤 Testing upload to S3...')
        const testKey = `test/test-${Date.now()}.json`
        const url = await s3Service.uploadFile(
            Buffer.from(JSON.stringify(testData, null, 2)),
            testKey,
            'application/json'
        )

        console.log('✅ Upload successful!')
        console.log(`📍 Test file URL: ${url}`)
        console.log('\n🎉 AWS S3 configuration is working correctly!')

    } catch (error: any) {
        console.error('❌ S3 test failed:', error.message)
        console.log('\n🔧 Troubleshooting tips:')
        console.log('1. Check your AWS credentials are correct')
        console.log('2. Verify the S3 bucket exists and you have permissions')
        console.log('3. Ensure the AWS region is correct')
        console.log('4. Check IAM permissions include s3:PutObject')
        process.exit(1)
    }
}

testS3Connection()