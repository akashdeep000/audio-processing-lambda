import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as apigw from 'aws-cdk-lib/aws-apigateway'
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'
import * as s3 from 'aws-cdk-lib/aws-s3';

export class AudioProcessingStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Creating an S3 bucket with CORS enabled
    const bucket = new s3.Bucket(this, 's3', {
      publicReadAccess: true,
      blockPublicAccess: {
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false,
      },
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.GET
          ],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true
    });
    //bucket.grantPublicAccess()

    // Creating a ffmpeg layer
    const ffmegLayer = new lambda.LayerVersion(this, 'ffmpeg-layer', {
      layerVersionName: 'ffmpeg',
      compatibleArchitectures: [lambda.Architecture.X86_64],
      code: lambda.AssetCode.fromAsset('ffmpeg'),
    });

    const fn = new NodejsFunction(this, 'lambda', {
      entry: 'lambda/index.ts',
      handler: 'handler',
      memorySize: 3008,
      timeout: cdk.Duration.seconds(300),
      runtime: lambda.Runtime.NODEJS_20_X,
      layers: [ffmegLayer],
      environment: {
        'BUCKET_NAME': bucket.bucketName
      }
    })

    fn.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
      cors: {
        allowedOrigins: ['*'],
        allowedMethods: [lambda.HttpMethod.ALL],
        allowedHeaders: ['*']
      }
    })

    bucket.grantReadWrite(fn)

    new apigw.LambdaRestApi(this, 'gateway', {
      handler: fn
    })
  }
}