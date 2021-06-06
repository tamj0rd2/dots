import * as pulumi from "@pulumi/pulumi"
import * as aws from "@pulumi/aws"
import * as mime from 'mime'
import * as fs from 'fs'
import * as path from 'path'

const bucketName = pulumi.getStack()
const bucket = new aws.s3.Bucket(bucketName, { bucket: bucketName, website: { indexDocument: 'index.html' } })
const distDir = path.resolve(__dirname, '../dist')

fs.readdirSync(distDir).forEach((item) => {
  const filePath = path.join(distDir, item)
  new aws.s3.BucketObject(item, {
    bucket: bucket,
    source: new pulumi.asset.FileAsset(filePath),
    contentType: mime.getType(filePath) || undefined,
  })
})

new aws.s3.BucketPolicy(bucketName, {
  bucket: bucket.bucket,
  policy: bucket.bucket.apply((bucketName) => JSON.stringify({
    Version: "2012-10-17",
    Statement: [{
      Effect: "Allow",
      Principal: "*",
      Action: [
        "s3:GetObject"
      ],
      Resource: [
        `arn:aws:s3:::${bucketName}/*`
      ]
    }]
  }))
})

export const siteUrl = bucket.websiteEndpoint
