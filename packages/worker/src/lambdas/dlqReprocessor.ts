import { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } from '@aws-sdk/client-sqs';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

/**
 * Reprocesses messages from CDC DLQ after OpenSearch index creation
 * Handles batch processing with error recovery
 */
export const handler = async () => {
  const sqsClient = new SQSClient({ region: process.env.AWS_REGION || 'us-west-2' });
  const lambdaClient = new LambdaClient({ region: process.env.AWS_REGION || 'us-west-2' });
  
  const DLQ_URL = process.env.DLQ_URL!;
  const CDC_FUNCTION_NAME = process.env.CDC_FUNCTION_NAME!;
  
  let processedCount = 0;
  let errorCount = 0;
  const maxBatches = 10; // Process up to 100 messages (10 messages per batch)
  
  for (let batch = 0; batch < maxBatches; batch++) {
    try {
      // Receive messages from DLQ
      const { Messages } = await sqsClient.send(new ReceiveMessageCommand({
        QueueUrl: DLQ_URL,
        MaxNumberOfMessages: 10,
        WaitTimeSeconds: 2,
      }));
      
      if (!Messages || Messages.length === 0) {
        console.log(`No more messages in DLQ. Processed: ${processedCount}, Errors: ${errorCount}`);
        break;
      }
      
      // Process each message
      for (const message of Messages) {
        try {
          // Parse the original DynamoDB Stream event from the DLQ message
          const messageBody = JSON.parse(message.Body!);
          
          // Reinvoke the CDC processor with the original event
          await lambdaClient.send(new InvokeCommand({
            FunctionName: CDC_FUNCTION_NAME,
            InvocationType: 'Event', // Async invocation
            Payload: JSON.stringify(messageBody),
          }));
          
          // Delete successfully reprocessed message from DLQ
          await sqsClient.send(new DeleteMessageCommand({
            QueueUrl: DLQ_URL,
            ReceiptHandle: message.ReceiptHandle!,
          }));
          
          processedCount++;
          console.log(`Reprocessed message ${message.MessageId}`);
          
        } catch (error) {
          console.error(`Failed to reprocess message: ${error}`);
          errorCount++;
          // Don't delete from DLQ if reprocessing failed
        }
      }
      
    } catch (error) {
      console.error(`Batch processing error: ${error}`);
      break;
    }
  }
  
  return {
    statusCode: 200,
    body: JSON.stringify({
      processed: processedCount,
      errors: errorCount,
      status: errorCount === 0 ? 'SUCCESS' : 'PARTIAL_SUCCESS'
    })
  };
};
