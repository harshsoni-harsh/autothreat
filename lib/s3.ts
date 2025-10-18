import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

class S3Service {
    private s3Client: S3Client | null = null
    private bucketName: string

    constructor() {
        this.bucketName = process.env.AWS_S3_BUCKET_NAME || 'autothreat-sboms'

        // Only initialize S3 client if credentials are available
        if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
            this.s3Client = new S3Client({
                region: process.env.AWS_REGION || 'us-east-1',
                credentials: {
                    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                },
                endpoint: process.env.AWS_S3_ENDPOINT || undefined,
            })
        }
    }

    async uploadSBOM(sbomData: any, projectId: string, sbomId: string): Promise<string> {
        if (!this.s3Client) {
            throw new Error('AWS S3 is not configured. Please set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_S3_BUCKET_NAME environment variables.')
        }

        const key = `sboms/${projectId}/${sbomId}.json`

        try {
            const command = new PutObjectCommand({
                Bucket: this.bucketName,
                Key: key,
                Body: JSON.stringify(sbomData, null, 2),
                ContentType: 'application/json',
                Metadata: {
                    'project-id': projectId,
                    'sbom-id': sbomId,
                    'uploaded-at': new Date().toISOString(),
                },
            })

            await this.s3Client.send(command)

            return `s3://${this.bucketName}/${key}`

        } catch (error) {
            console.error('Error uploading SBOM to S3:', error)
            throw new Error('Failed to upload SBOM to storage')
        }
    }

    async uploadFile(fileBuffer: Buffer, key: string, contentType: string = 'application/octet-stream'): Promise<string> {
        if (!this.s3Client) {
            throw new Error('AWS S3 is not configured. Please set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_S3_BUCKET_NAME environment variables.')
        }

        try {
            const command = new PutObjectCommand({
                Bucket: this.bucketName,
                Key: key,
                Body: fileBuffer,
                ContentType: contentType,
            })

            await this.s3Client.send(command)

            return `s3://${this.bucketName}/${key}`

        } catch (error) {
            console.error('Error uploading file to S3:', error)
            throw new Error('Failed to upload file to storage')
        }
    }

    async deleteSBOM(projectId: string, sbomId: string): Promise<void> {
        if (!this.s3Client) {
            throw new Error('AWS S3 is not configured. Please set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_S3_BUCKET_NAME environment variables.')
        }

        const key = `sboms/${projectId}/${sbomId}.json`

        try {
            const command = new DeleteObjectCommand({
                Bucket: this.bucketName,
                Key: key,
            })

            await this.s3Client.send(command)
        } catch (error) {
            console.error('Error deleting SBOM from S3:', error)
            throw new Error('Failed to delete SBOM from storage')
        }
    }

    isConfigured(): boolean {
        return this.s3Client !== null
    }
}

// Export singleton instance
export const s3Service = new S3Service()
export default s3Service