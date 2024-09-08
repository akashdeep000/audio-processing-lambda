# Welcome to your CDK TypeScript project

This is a audio-processing project for CDK development with TypeScript.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npx cdk deploy`  deploy this stack to your default AWS account/region
* `npx cdk diff`    compare deployed stack with current state
* `npx cdk synth`   emits the synthesized CloudFormation template

## Deploy the stack on AWS


### Configure IAM

- Go to AWS Identity and Access Management (IAM)
- Create a new policie from JSON
```json
{
	"Version": "2012-10-17",
	"Statement": [
		{
			"Effect": "Allow",
			"Action": [
				"sts:AssumeRole"
			],
			"Resource": [
				"arn:aws:iam::*:role/cdk-*"
			]
		},
		{
            "Effect": "Allow",
            "Action": [
                "cloudformation:*"
            ],
            "Resource": "*"
        }
	]
}
```
- Save the policie by providing a name (eg: cdk-deploy).
- Create a user and as attatch permissions policie that you just created frow AWS console.
- Select the newly created user and go to the `Security credentials` tab.
- Now on the `Access keys` section, click on the `Create access key` button.
- Now select use case `Command Line Interface (CLI)` and confirm. Click on the next button.
- Click `Create access key` button.
- Now store the `Access key` and `Secret access key`.


### Configure Github Action
- Go to github repo settings.
- On the `Security` section click on `Secrets and variable` and then click on `action`.
- Now click on `New repository secret` and two secret `AWS_ACCESS_KEY_ID` and `AWS_SECRET_KEY` and the value should be the `Access key` and `Secret access key` you got from AWS console.
- (Optional) Set another secret `AWS_REGION` to specify the deployment region. Default region is `us-east-1`.


### Manually trigger deployment
- You can triger deployment manually by going to `Action` tab on github repo.
- The choosing `CDK Deploy` action and clicking on `Run workflow` button.


### Auto-deploy on code push
If you set up github action then whenever a new code push happen on `master` branch, the deployment will update automatically.


### Lambda api gatway url

You can find the deployment url inside github action log.
Here is a sample output:
```sh
  ✅  AudioProcessingStack

✨  Deployment time: 42.59s

Outputs:
AudioProcessingStack.gatewayEndpointDA8D204E = https://fivtqcifhd.execute-api.us-east-1.amazonaws.com/prod/
Stack ARN:
arn:aws:cloudformation:us-east-1:***:stack/AudioProcessingStack/b4cff7e0-6df8-11ef-b5ff-0ee5f6741be1

✨  Total time: 47.23s

```
You can see here there is a url `https://fivtqcifhd.execute-api.us-east-1.amazonaws.com/prod/` inside log output. This is the lambda api gatway URL.

You can invoke lambda using this URL.


### Setup custom domain

If you want to add a custom domain you can follow this guide: https://medium.com/geekculture/how-to-add-a-custom-domain-to-lambda-functions-1bc0ae639676


### Configure lambda RAM size and timeout setting

You can change lambda RAM size and timeout setting inside this file: `lib/audio-processing-stack.ts`

These are the currentl values:
```js
memorySize: 3008
timeout: cdk.Duration.seconds(300)
```

