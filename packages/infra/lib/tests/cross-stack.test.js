"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const aws_cdk_lib_1 = require("aws-cdk-lib");
const assertions_1 = require("aws-cdk-lib/assertions");
const s3 = __importStar(require("aws-cdk-lib/aws-s3"));
const compute_stack_1 = require("../lib/compute-stack");
describe('Cross-Stack Dependencies', () => {
    test('CDC Lambda has OPENSEARCH_ENDPOINT environment variable', () => {
        const app = new aws_cdk_lib_1.App();
        const parent = new aws_cdk_lib_1.Stack(app, 'Parent');
        const bucket = new s3.Bucket(parent, 'Artifacts');
        // Provide env var as done in bin app (via process.env)
        process.env.OPENSEARCH_ENDPOINT = 'https://aoss-example.us-west-2.aoss.amazonaws.com';
        const compute = new compute_stack_1.ComputeStack(parent, 'Compute', {
            artifactsBucket: bucket,
            patternTableName: 'HelixPatternEntries',
        });
        const template = assertions_1.Template.fromStack(compute);
        template.hasResourceProperties('AWS::Lambda::Function', {
            Environment: {
                Variables: assertions_1.Match.objectLike({
                    OPENSEARCH_ENDPOINT: assertions_1.Match.anyValue(),
                }),
            },
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3Jvc3Mtc3RhY2sudGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3Rlc3RzL2Nyb3NzLXN0YWNrLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLDZDQUF5QztBQUN6Qyx1REFBeUQ7QUFDekQsdURBQXlDO0FBQ3pDLHdEQUFvRDtBQUVwRCxRQUFRLENBQUMsMEJBQTBCLEVBQUUsR0FBRyxFQUFFO0lBQ3hDLElBQUksQ0FBQyx5REFBeUQsRUFBRSxHQUFHLEVBQUU7UUFDbkUsTUFBTSxHQUFHLEdBQUcsSUFBSSxpQkFBRyxFQUFFLENBQUM7UUFDdEIsTUFBTSxNQUFNLEdBQUcsSUFBSSxtQkFBSyxDQUFDLEdBQUcsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUN4QyxNQUFNLE1BQU0sR0FBRyxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLFdBQVcsQ0FBQyxDQUFDO1FBRWxELHVEQUF1RDtRQUN2RCxPQUFPLENBQUMsR0FBRyxDQUFDLG1CQUFtQixHQUFHLG1EQUFtRCxDQUFDO1FBRXRGLE1BQU0sT0FBTyxHQUFHLElBQUksNEJBQVksQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFO1lBQ2xELGVBQWUsRUFBRSxNQUFNO1lBQ3ZCLGdCQUFnQixFQUFFLHFCQUFxQjtTQUN4QyxDQUFDLENBQUM7UUFFSCxNQUFNLFFBQVEsR0FBRyxxQkFBUSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUM3QyxRQUFRLENBQUMscUJBQXFCLENBQUMsdUJBQXVCLEVBQUU7WUFDdEQsV0FBVyxFQUFFO2dCQUNYLFNBQVMsRUFBRSxrQkFBSyxDQUFDLFVBQVUsQ0FBQztvQkFDMUIsbUJBQW1CLEVBQUUsa0JBQUssQ0FBQyxRQUFRLEVBQUU7aUJBQ3RDLENBQUM7YUFDSDtTQUNGLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBcHAsIFN0YWNrIH0gZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0IHsgVGVtcGxhdGUsIE1hdGNoIH0gZnJvbSAnYXdzLWNkay1saWIvYXNzZXJ0aW9ucyc7XG5pbXBvcnQgKiBhcyBzMyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtczMnO1xuaW1wb3J0IHsgQ29tcHV0ZVN0YWNrIH0gZnJvbSAnLi4vbGliL2NvbXB1dGUtc3RhY2snO1xuXG5kZXNjcmliZSgnQ3Jvc3MtU3RhY2sgRGVwZW5kZW5jaWVzJywgKCkgPT4ge1xuICB0ZXN0KCdDREMgTGFtYmRhIGhhcyBPUEVOU0VBUkNIX0VORFBPSU5UIGVudmlyb25tZW50IHZhcmlhYmxlJywgKCkgPT4ge1xuICAgIGNvbnN0IGFwcCA9IG5ldyBBcHAoKTtcbiAgICBjb25zdCBwYXJlbnQgPSBuZXcgU3RhY2soYXBwLCAnUGFyZW50Jyk7XG4gICAgY29uc3QgYnVja2V0ID0gbmV3IHMzLkJ1Y2tldChwYXJlbnQsICdBcnRpZmFjdHMnKTtcblxuICAgIC8vIFByb3ZpZGUgZW52IHZhciBhcyBkb25lIGluIGJpbiBhcHAgKHZpYSBwcm9jZXNzLmVudilcbiAgICBwcm9jZXNzLmVudi5PUEVOU0VBUkNIX0VORFBPSU5UID0gJ2h0dHBzOi8vYW9zcy1leGFtcGxlLnVzLXdlc3QtMi5hb3NzLmFtYXpvbmF3cy5jb20nO1xuXG4gICAgY29uc3QgY29tcHV0ZSA9IG5ldyBDb21wdXRlU3RhY2socGFyZW50LCAnQ29tcHV0ZScsIHtcbiAgICAgIGFydGlmYWN0c0J1Y2tldDogYnVja2V0LFxuICAgICAgcGF0dGVyblRhYmxlTmFtZTogJ0hlbGl4UGF0dGVybkVudHJpZXMnLFxuICAgIH0pO1xuXG4gICAgY29uc3QgdGVtcGxhdGUgPSBUZW1wbGF0ZS5mcm9tU3RhY2soY29tcHV0ZSk7XG4gICAgdGVtcGxhdGUuaGFzUmVzb3VyY2VQcm9wZXJ0aWVzKCdBV1M6OkxhbWJkYTo6RnVuY3Rpb24nLCB7XG4gICAgICBFbnZpcm9ubWVudDoge1xuICAgICAgICBWYXJpYWJsZXM6IE1hdGNoLm9iamVjdExpa2Uoe1xuICAgICAgICAgIE9QRU5TRUFSQ0hfRU5EUE9JTlQ6IE1hdGNoLmFueVZhbHVlKCksXG4gICAgICAgIH0pLFxuICAgICAgfSxcbiAgICB9KTtcbiAgfSk7XG59KTtcbiJdfQ==