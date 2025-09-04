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
const assertions_1 = require("aws-cdk-lib/assertions");
const cdk = __importStar(require("aws-cdk-lib"));
const opensearch_stack_1 = require("../lib/opensearch-stack");
const opensearch_maintenance_stack_1 = require("../lib/opensearch-maintenance-stack");
describe('Infrastructure Stacks', () => {
    test('OpenSearch Stack creates collection with correct configuration', () => {
        const app = new cdk.App();
        const stack = new opensearch_stack_1.OpenSearchStack(app, 'TestOpenSearchStack');
        const template = assertions_1.Template.fromStack(stack);
        template.hasResourceProperties('AWS::OpenSearchServerless::Collection', {
            Name: 'helix-patterns',
            Type: 'VECTORSEARCH'
        });
        template.hasResourceProperties('AWS::OpenSearchServerless::SecurityPolicy', {
            Type: 'encryption'
        });
    });
    test('Maintenance Stack creates Lambda functions with correct runtime', () => {
        const app = new cdk.App();
        const stack = new opensearch_maintenance_stack_1.OpenSearchMaintenanceStack(app, 'TestMaintenanceStack', {
            opensearchEndpoint: 'https://test.aoss.amazonaws.com',
            collectionArn: 'arn:aws:aoss:us-west-2:123456789012:collection/test'
        });
        const template = assertions_1.Template.fromStack(stack);
        template.hasResourceProperties('AWS::Lambda::Function', {
            Runtime: 'nodejs20.x',
            Architecture: 'arm64'
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhY2tzLnRlc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi90ZXN0cy9zdGFja3MudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsdURBQWtEO0FBQ2xELGlEQUFtQztBQUNuQyw4REFBMEQ7QUFDMUQsc0ZBQWlGO0FBRWpGLFFBQVEsQ0FBQyx1QkFBdUIsRUFBRSxHQUFHLEVBQUU7SUFDckMsSUFBSSxDQUFDLGdFQUFnRSxFQUFFLEdBQUcsRUFBRTtRQUMxRSxNQUFNLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUMxQixNQUFNLEtBQUssR0FBRyxJQUFJLGtDQUFlLENBQUMsR0FBRyxFQUFFLHFCQUFxQixDQUFDLENBQUM7UUFDOUQsTUFBTSxRQUFRLEdBQUcscUJBQVEsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUM7UUFFM0MsUUFBUSxDQUFDLHFCQUFxQixDQUFDLHVDQUF1QyxFQUFFO1lBQ3RFLElBQUksRUFBRSxnQkFBZ0I7WUFDdEIsSUFBSSxFQUFFLGNBQWM7U0FDckIsQ0FBQyxDQUFDO1FBRUgsUUFBUSxDQUFDLHFCQUFxQixDQUFDLDJDQUEyQyxFQUFFO1lBQzFFLElBQUksRUFBRSxZQUFZO1NBQ25CLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0lBRUgsSUFBSSxDQUFDLGlFQUFpRSxFQUFFLEdBQUcsRUFBRTtRQUMzRSxNQUFNLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUMxQixNQUFNLEtBQUssR0FBRyxJQUFJLHlEQUEwQixDQUFDLEdBQUcsRUFBRSxzQkFBc0IsRUFBRTtZQUN4RSxrQkFBa0IsRUFBRSxpQ0FBaUM7WUFDckQsYUFBYSxFQUFFLHFEQUFxRDtTQUNyRSxDQUFDLENBQUM7UUFDSCxNQUFNLFFBQVEsR0FBRyxxQkFBUSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUUzQyxRQUFRLENBQUMscUJBQXFCLENBQUMsdUJBQXVCLEVBQUU7WUFDdEQsT0FBTyxFQUFFLFlBQVk7WUFDckIsWUFBWSxFQUFFLE9BQU87U0FDdEIsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFRlbXBsYXRlIH0gZnJvbSAnYXdzLWNkay1saWIvYXNzZXJ0aW9ucyc7XG5pbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0IHsgT3BlblNlYXJjaFN0YWNrIH0gZnJvbSAnLi4vbGliL29wZW5zZWFyY2gtc3RhY2snO1xuaW1wb3J0IHsgT3BlblNlYXJjaE1haW50ZW5hbmNlU3RhY2sgfSBmcm9tICcuLi9saWIvb3BlbnNlYXJjaC1tYWludGVuYW5jZS1zdGFjayc7XG5cbmRlc2NyaWJlKCdJbmZyYXN0cnVjdHVyZSBTdGFja3MnLCAoKSA9PiB7XG4gIHRlc3QoJ09wZW5TZWFyY2ggU3RhY2sgY3JlYXRlcyBjb2xsZWN0aW9uIHdpdGggY29ycmVjdCBjb25maWd1cmF0aW9uJywgKCkgPT4ge1xuICAgIGNvbnN0IGFwcCA9IG5ldyBjZGsuQXBwKCk7XG4gICAgY29uc3Qgc3RhY2sgPSBuZXcgT3BlblNlYXJjaFN0YWNrKGFwcCwgJ1Rlc3RPcGVuU2VhcmNoU3RhY2snKTtcbiAgICBjb25zdCB0ZW1wbGF0ZSA9IFRlbXBsYXRlLmZyb21TdGFjayhzdGFjayk7XG4gICAgXG4gICAgdGVtcGxhdGUuaGFzUmVzb3VyY2VQcm9wZXJ0aWVzKCdBV1M6Ok9wZW5TZWFyY2hTZXJ2ZXJsZXNzOjpDb2xsZWN0aW9uJywge1xuICAgICAgTmFtZTogJ2hlbGl4LXBhdHRlcm5zJyxcbiAgICAgIFR5cGU6ICdWRUNUT1JTRUFSQ0gnXG4gICAgfSk7XG4gICAgXG4gICAgdGVtcGxhdGUuaGFzUmVzb3VyY2VQcm9wZXJ0aWVzKCdBV1M6Ok9wZW5TZWFyY2hTZXJ2ZXJsZXNzOjpTZWN1cml0eVBvbGljeScsIHtcbiAgICAgIFR5cGU6ICdlbmNyeXB0aW9uJ1xuICAgIH0pO1xuICB9KTtcbiAgXG4gIHRlc3QoJ01haW50ZW5hbmNlIFN0YWNrIGNyZWF0ZXMgTGFtYmRhIGZ1bmN0aW9ucyB3aXRoIGNvcnJlY3QgcnVudGltZScsICgpID0+IHtcbiAgICBjb25zdCBhcHAgPSBuZXcgY2RrLkFwcCgpO1xuICAgIGNvbnN0IHN0YWNrID0gbmV3IE9wZW5TZWFyY2hNYWludGVuYW5jZVN0YWNrKGFwcCwgJ1Rlc3RNYWludGVuYW5jZVN0YWNrJywge1xuICAgICAgb3BlbnNlYXJjaEVuZHBvaW50OiAnaHR0cHM6Ly90ZXN0LmFvc3MuYW1hem9uYXdzLmNvbScsXG4gICAgICBjb2xsZWN0aW9uQXJuOiAnYXJuOmF3czphb3NzOnVzLXdlc3QtMjoxMjM0NTY3ODkwMTI6Y29sbGVjdGlvbi90ZXN0J1xuICAgIH0pO1xuICAgIGNvbnN0IHRlbXBsYXRlID0gVGVtcGxhdGUuZnJvbVN0YWNrKHN0YWNrKTtcbiAgICBcbiAgICB0ZW1wbGF0ZS5oYXNSZXNvdXJjZVByb3BlcnRpZXMoJ0FXUzo6TGFtYmRhOjpGdW5jdGlvbicsIHtcbiAgICAgIFJ1bnRpbWU6ICdub2RlanMyMC54JyxcbiAgICAgIEFyY2hpdGVjdHVyZTogJ2FybTY0J1xuICAgIH0pO1xuICB9KTtcbn0pOyJdfQ==