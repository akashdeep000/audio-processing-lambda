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
- Create a user and as attatch permissions policie `AWSCloudFormationFullAccess` frow AWS console.
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


### Configure lambda RAM size and timeout setting

You can change lambda RAM size and timeout setting inside this file: `lib/audio-processing-stack.ts`

These are the currentl values:
```js
memorySize: 3008
timeout: cdk.Duration.seconds(300)
```

