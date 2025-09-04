#!/usr/bin/env node
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
require("source-map-support/register");
const cdk = __importStar(require("aws-cdk-lib"));
const opensearch_maintenance_stack_1 = require("../lib/opensearch-maintenance-stack");
const app = new cdk.App();
// Deploy maintenance stack with existing OpenSearch collection
new opensearch_maintenance_stack_1.OpenSearchMaintenanceStack(app, 'EcosystemCL-OpenSearchMaintenanceStack', {
    opensearchEndpoint: 'https://zwrsnhyybevsl08y2pn3.us-west-2.aoss.amazonaws.com',
    collectionArn: 'arn:aws:aoss:us-west-2:219895243073:collection/zwrsnhyybevsl08y2pn3',
    env: {
        account: '219895243073',
        region: 'us-west-2',
    },
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVwbG95LW1haW50ZW5hbmNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vYmluL2RlcGxveS1tYWludGVuYW5jZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUNBLHVDQUFxQztBQUNyQyxpREFBbUM7QUFDbkMsc0ZBQWlGO0FBRWpGLE1BQU0sR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBRTFCLCtEQUErRDtBQUMvRCxJQUFJLHlEQUEwQixDQUFDLEdBQUcsRUFBRSx3Q0FBd0MsRUFBRTtJQUM1RSxrQkFBa0IsRUFBRSwyREFBMkQ7SUFDL0UsYUFBYSxFQUFFLHFFQUFxRTtJQUNwRixHQUFHLEVBQUU7UUFDSCxPQUFPLEVBQUUsY0FBYztRQUN2QixNQUFNLEVBQUUsV0FBVztLQUNwQjtDQUNGLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIiMhL3Vzci9iaW4vZW52IG5vZGVcbmltcG9ydCAnc291cmNlLW1hcC1zdXBwb3J0L3JlZ2lzdGVyJztcbmltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgeyBPcGVuU2VhcmNoTWFpbnRlbmFuY2VTdGFjayB9IGZyb20gJy4uL2xpYi9vcGVuc2VhcmNoLW1haW50ZW5hbmNlLXN0YWNrJztcblxuY29uc3QgYXBwID0gbmV3IGNkay5BcHAoKTtcblxuLy8gRGVwbG95IG1haW50ZW5hbmNlIHN0YWNrIHdpdGggZXhpc3RpbmcgT3BlblNlYXJjaCBjb2xsZWN0aW9uXG5uZXcgT3BlblNlYXJjaE1haW50ZW5hbmNlU3RhY2soYXBwLCAnRWNvc3lzdGVtQ0wtT3BlblNlYXJjaE1haW50ZW5hbmNlU3RhY2snLCB7XG4gIG9wZW5zZWFyY2hFbmRwb2ludDogJ2h0dHBzOi8vendyc25oeXliZXZzbDA4eTJwbjMudXMtd2VzdC0yLmFvc3MuYW1hem9uYXdzLmNvbScsXG4gIGNvbGxlY3Rpb25Bcm46ICdhcm46YXdzOmFvc3M6dXMtd2VzdC0yOjIxOTg5NTI0MzA3Mzpjb2xsZWN0aW9uL3p3cnNuaHl5YmV2c2wwOHkycG4zJyxcbiAgZW52OiB7XG4gICAgYWNjb3VudDogJzIxOTg5NTI0MzA3MycsXG4gICAgcmVnaW9uOiAndXMtd2VzdC0yJyxcbiAgfSxcbn0pOyJdfQ==