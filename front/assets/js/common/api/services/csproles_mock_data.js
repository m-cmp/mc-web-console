// CSP Roles Mock Data Service
// Mock 데이터 생성 및 API 요청 처리

// ===== Mock Data Generation =====

// CSP Roles 목데이터 생성
function generateMockCspRoles() {
    const mockRoles = [
        {
            id: "csp-role-aws-001",
            name: "AWS-AdminRole",
            description: "AWS Administrator role for full access",
            provider: "aws"
        },
        {
            id: "csp-role-azure-001",
            name: "Azure-ReaderRole",
            description: "Azure Reader role for read-only access",
            provider: "azure"
        },
        {
            id: "csp-role-gcp-001",
            name: "GCP-DeveloperRole",
            description: "GCP Developer role for development access",
            provider: "gcp"
        },
        {
            id: "csp-role-alibaba-001",
            name: "Alibaba-UserRole",
            description: "Alibaba Cloud User role for basic access",
            provider: "alibaba"
        },
        {
            id: "csp-role-tencent-001",
            name: "Tencent-PowerUserRole",
            description: "Tencent Cloud Power User role for advanced access",
            provider: "tencent"
        },
        {
            id: "csp-role-nhn-001",
            name: "NHN-DeveloperRole",
            description: "NHN Cloud Developer role for development and testing access",
            provider: "nhn"
        }
    ];

    return mockRoles;
}

// Trust Policy 생성 함수
function generateTrustPolicy(provider, roleType) {
    const basePolicy = {
        version: "2012-10-17",
        statement: []
    };

    switch (provider) {
        case 'aws':
            basePolicy.statement = [{
                effect: "Allow",
                principal: {
                    service: ["ec2.amazonaws.com", "lambda.amazonaws.com"]
                },
                action: roleType === 'Admin' ? ["*"] : ["s3:GetObject", "s3:PutObject"],
                resource: roleType === 'Admin' ? ["*"] : ["arn:aws:s3:::my-bucket/*"]
            }];
            break;
        case 'azure':
            basePolicy.statement = [{
                effect: "Allow",
                principal: {
                    user: ["*"]
                },
                action: roleType === 'Admin' ? ["*"] : ["Microsoft.Storage/storageAccounts/read"],
                resource: ["*"]
            }];
            break;
        case 'gcp':
            basePolicy.statement = [{
                effect: "Allow",
                principal: {
                    service: ["compute@developer.gserviceaccount.com"]
                },
                action: roleType === 'Admin' ? ["*"] : ["storage.objects.get", "storage.objects.create"],
                resource: ["*"]
            }];
            break;
        case 'alibaba':
            basePolicy.statement = [{
                effect: "Allow",
                principal: {
                    service: ["ecs.aliyuncs.com"]
                },
                action: roleType === 'Admin' ? ["*"] : ["oss:GetObject", "oss:PutObject"],
                resource: ["*"]
            }];
            break;
        case 'tencent':
            basePolicy.statement = [{
                effect: "Allow",
                principal: {
                    service: ["cvm.qcloud.com"]
                },
                action: roleType === 'Admin' ? ["*"] : ["cos:GetObject", "cos:PutObject"],
                resource: ["*"]
            }];
            break;
        case 'nhn':
            basePolicy.statement = [{
                effect: "Allow",
                principal: {
                    service: ["compute.nhncloud.com"]
                },
                action: roleType === 'Admin' ? ["*"] : ["objectstorage:GetObject", "objectstorage:PutObject"],
                resource: ["*"]
            }];
            break;
    }

    return basePolicy;
}

// CSP Policies 목데이터 생성
function generateMockCspPolicies() {
    const mockPolicies = [
        {
            id: "csp-policy-aws-s3",
            name: "AWS-S3FullAccess",
            description: "AWS S3 Full Access Policy for bucket operations",
            provider: "aws",
            document: {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "S3FullAccess",
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetObject",
                            "s3:PutObject",
                            "s3:DeleteObject",
                            "s3:ListBucket",
                            "s3:GetBucketLocation",
                            "s3:GetBucketVersioning",
                            "s3:PutBucketVersioning",
                            "s3:GetBucketPolicy",
                            "s3:PutBucketPolicy",
                            "s3:DeleteBucketPolicy"
                        ],
                        "Resource": [
                            "arn:aws:s3:::my-company-bucket",
                            "arn:aws:s3:::my-company-bucket/*"
                        ]
                    },
                    {
                        "Sid": "S3ListAllBuckets",
                        "Effect": "Allow",
                        "Action": "s3:ListAllMyBuckets",
                        "Resource": "*"
                    }
                ]
            },
            created_at: "2024-01-15T09:30:00Z",
            status: "active"
        },
        {
            id: "csp-policy-aws-ec2",
            name: "AWS-EC2Management",
            description: "AWS EC2 Management Policy for instance operations",
            provider: "aws",
            document: {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "EC2InstanceManagement",
                        "Effect": "Allow",
                        "Action": [
                            "ec2:RunInstances",
                            "ec2:TerminateInstances",
                            "ec2:StartInstances",
                            "ec2:StopInstances",
                            "ec2:RebootInstances",
                            "ec2:DescribeInstances",
                            "ec2:DescribeImages",
                            "ec2:DescribeInstanceTypes",
                            "ec2:DescribeKeyPairs",
                            "ec2:DescribeSecurityGroups",
                            "ec2:DescribeSubnets",
                            "ec2:DescribeVpcs"
                        ],
                        "Resource": "*",
                        "Condition": {
                            "StringEquals": {
                                "ec2:Region": "us-west-2"
                            }
                        }
                    },
                    {
                        "Sid": "EC2TagManagement",
                        "Effect": "Allow",
                        "Action": [
                            "ec2:CreateTags",
                            "ec2:DeleteTags",
                            "ec2:DescribeTags"
                        ],
                        "Resource": "*"
                    }
                ]
            },
            created_at: "2024-01-16T10:15:00Z",
            status: "active"
        },
        {
            id: "csp-policy-azure-storage",
            name: "Azure-StorageReadWrite",
            description: "Azure Storage Read/Write Policy for blob operations",
            provider: "azure",
            document: {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "StorageBlobOperations",
                        "Effect": "Allow",
                        "Action": [
                            "Microsoft.Storage/storageAccounts/blobServices/containers/read",
                            "Microsoft.Storage/storageAccounts/blobServices/containers/write",
                            "Microsoft.Storage/storageAccounts/blobServices/containers/delete",
                            "Microsoft.Storage/storageAccounts/blobServices/generateUserDelegationKey/action"
                        ],
                        "Resource": [
                            "subscriptions/*/resourceGroups/my-rg/providers/Microsoft.Storage/storageAccounts/mystorageaccount"
                        ]
                    },
                    {
                        "Sid": "StorageAccountAccess",
                        "Effect": "Allow",
                        "Action": [
                            "Microsoft.Storage/storageAccounts/read",
                            "Microsoft.Storage/storageAccounts/listKeys/action"
                        ],
                        "Resource": "*"
                    }
                ]
            },
            created_at: "2024-01-17T11:20:00Z",
            status: "active"
        },
        {
            id: "csp-policy-gcp-compute",
            name: "GCP-ComputeEngineAccess",
            description: "GCP Compute Engine Access Policy for VM operations",
            provider: "gcp",
            document: {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "ComputeInstanceManagement",
                        "Effect": "Allow",
                        "Action": [
                            "compute.instances.create",
                            "compute.instances.delete",
                            "compute.instances.start",
                            "compute.instances.stop",
                            "compute.instances.get",
                            "compute.instances.list",
                            "compute.instances.setMetadata",
                            "compute.instances.setTags"
                        ],
                        "Resource": [
                            "projects/my-project/zones/*/instances/*"
                        ]
                    },
                    {
                        "Sid": "ComputeNetworkAccess",
                        "Effect": "Allow",
                        "Action": [
                            "compute.networks.get",
                            "compute.networks.list",
                            "compute.subnetworks.get",
                            "compute.subnetworks.list",
                            "compute.firewalls.get",
                            "compute.firewalls.list"
                        ],
                        "Resource": "*"
                    },
                    {
                        "Sid": "ComputeImageAccess",
                        "Effect": "Allow",
                        "Action": [
                            "compute.images.get",
                            "compute.images.list",
                            "compute.images.use"
                        ],
                        "Resource": "*"
                    }
                ]
            },
            created_at: "2024-01-18T08:45:00Z",
            status: "active"
        },
        {
            id: "csp-policy-gcp-storage",
            name: "GCP-CloudStorageAccess",
            description: "GCP Cloud Storage Access Policy for bucket operations",
            provider: "gcp",
            document: {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "StorageObjectAccess",
                        "Effect": "Allow",
                        "Action": [
                            "storage.objects.create",
                            "storage.objects.delete",
                            "storage.objects.get",
                            "storage.objects.list",
                            "storage.objects.update"
                        ],
                        "Resource": [
                            "projects/my-project/buckets/my-company-bucket/objects/*"
                        ]
                    },
                    {
                        "Sid": "StorageBucketAccess",
                        "Effect": "Allow",
                        "Action": [
                            "storage.buckets.get",
                            "storage.buckets.list",
                            "storage.buckets.create",
                            "storage.buckets.delete"
                        ],
                        "Resource": "*"
                    }
                ]
            },
            created_at: "2024-01-19T14:30:00Z",
            status: "active"
        },
        {
            id: "csp-policy-alibaba-oss",
            name: "Alibaba-OSSFullAccess",
            description: "Alibaba Cloud OSS Full Access Policy",
            provider: "alibaba",
            document: {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "OSSObjectOperations",
                        "Effect": "Allow",
                        "Action": [
                            "oss:GetObject",
                            "oss:PutObject",
                            "oss:DeleteObject",
                            "oss:ListObjects",
                            "oss:GetObjectMeta",
                            "oss:PutObjectMeta"
                        ],
                        "Resource": [
                            "acs:oss:*:*:my-company-bucket",
                            "acs:oss:*:*:my-company-bucket/*"
                        ]
                    },
                    {
                        "Sid": "OSSBucketOperations",
                        "Effect": "Allow",
                        "Action": [
                            "oss:GetBucket",
                            "oss:ListBuckets",
                            "oss:GetBucketLocation",
                            "oss:GetBucketInfo",
                            "oss:GetBucketAcl",
                            "oss:PutBucketAcl"
                        ],
                        "Resource": "*"
                    }
                ]
            },
            created_at: "2024-01-20T16:45:00Z",
            status: "active"
        },
        {
            id: "csp-policy-tencent-cos",
            name: "Tencent-COSFullAccess",
            description: "Tencent Cloud COS Full Access Policy",
            provider: "tencent",
            document: {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "COSObjectOperations",
                        "Effect": "Allow",
                        "Action": [
                            "cos:GetObject",
                            "cos:PutObject",
                            "cos:DeleteObject",
                            "cos:ListObjects",
                            "cos:GetObjectMeta",
                            "cos:PutObjectMeta"
                        ],
                        "Resource": [
                            "qcs::cos:*:*:my-company-bucket",
                            "qcs::cos:*:*:my-company-bucket/*"
                        ]
                    },
                    {
                        "Sid": "COSBucketOperations",
                        "Effect": "Allow",
                        "Action": [
                            "cos:GetBucket",
                            "cos:ListBuckets",
                            "cos:GetBucketLocation",
                            "cos:GetBucketInfo",
                            "cos:GetBucketAcl",
                            "cos:PutBucketAcl"
                        ],
                        "Resource": "*"
                    }
                ]
            },
            created_at: "2024-01-21T12:30:00Z",
            status: "active"
        },
        {
            id: "csp-policy-aws-lambda",
            name: "AWS-LambdaExecution",
            description: "AWS Lambda Execution Policy for serverless functions",
            provider: "aws",
            document: {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "LambdaFunctionManagement",
                        "Effect": "Allow",
                        "Action": [
                            "lambda:CreateFunction",
                            "lambda:DeleteFunction",
                            "lambda:GetFunction",
                            "lambda:ListFunctions",
                            "lambda:UpdateFunctionCode",
                            "lambda:UpdateFunctionConfiguration",
                            "lambda:InvokeFunction"
                        ],
                        "Resource": [
                            "arn:aws:lambda:us-west-2:*:function:my-company-*"
                        ]
                    },
                    {
                        "Sid": "LambdaLogsAccess",
                        "Effect": "Allow",
                        "Action": [
                            "logs:CreateLogGroup",
                            "logs:CreateLogStream",
                            "logs:PutLogEvents",
                            "logs:DescribeLogGroups",
                            "logs:DescribeLogStreams"
                        ],
                        "Resource": [
                            "arn:aws:logs:us-west-2:*:log-group:/aws/lambda/my-company-*"
                        ]
                    }
                ]
            },
            created_at: "2024-01-22T09:15:00Z",
            status: "active"
        },
        {
            id: "csp-policy-nhn-compute",
            name: "NHN-ComputeEngineAccess",
            description: "NHN Cloud Compute Engine Access Policy for VM operations",
            provider: "nhn",
            document: {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "ComputeInstanceManagement",
                        "Effect": "Allow",
                        "Action": [
                            "compute.instances.create",
                            "compute.instances.delete",
                            "compute.instances.start",
                            "compute.instances.stop",
                            "compute.instances.get",
                            "compute.instances.list",
                            "compute.instances.setMetadata",
                            "compute.instances.setTags"
                        ],
                        "Resource": [
                            "projects/my-project/zones/*/instances/*"
                        ]
                    },
                    {
                        "Sid": "ComputeNetworkAccess",
                        "Effect": "Allow",
                        "Action": [
                            "compute.networks.get",
                            "compute.networks.list",
                            "compute.subnetworks.get",
                            "compute.subnetworks.list",
                            "compute.firewalls.get",
                            "compute.firewalls.list"
                        ],
                        "Resource": "*"
                    }
                ]
            },
            created_at: "2024-01-23T10:30:00Z",
            status: "active"
        },
        {
            id: "csp-policy-nhn-storage",
            name: "NHN-ObjectStorageAccess",
            description: "NHN Cloud Object Storage Access Policy for bucket operations",
            provider: "nhn",
            document: {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "ObjectStorageAccess",
                        "Effect": "Allow",
                        "Action": [
                            "objectstorage.objects.create",
                            "objectstorage.objects.delete",
                            "objectstorage.objects.get",
                            "objectstorage.objects.list",
                            "objectstorage.objects.update"
                        ],
                        "Resource": [
                            "projects/my-project/buckets/my-company-bucket/objects/*"
                        ]
                    },
                    {
                        "Sid": "BucketAccess",
                        "Effect": "Allow",
                        "Action": [
                            "objectstorage.buckets.get",
                            "objectstorage.buckets.list",
                            "objectstorage.buckets.create",
                            "objectstorage.buckets.delete"
                        ],
                        "Resource": "*"
                    }
                ]
            },
            created_at: "2024-01-23T11:45:00Z",
            status: "active"
        }
    ];

    return mockPolicies;
}

// Policy Document 생성 함수
function generatePolicyDocument(policyType) {
    const baseDocument = {
        version: "2012-10-17",
        statement: []
    };

    switch (policyType) {
        case 'S3FullAccess':
            baseDocument.statement = [{
                effect: "Allow",
                action: ["s3:*"],
                resource: ["*"]
            }];
            break;
        case 'EC2ReadOnly':
            baseDocument.statement = [{
                effect: "Allow",
                action: ["ec2:Describe*"],
                resource: ["*"]
            }];
            break;
        case 'LambdaExecute':
            baseDocument.statement = [{
                effect: "Allow",
                action: ["lambda:InvokeFunction"],
                resource: ["*"]
            }];
            break;
        case 'StorageAccess':
            baseDocument.statement = [{
                effect: "Allow",
                action: ["storage.objects.get", "storage.objects.create"],
                resource: ["*"]
            }];
            break;
        case 'ComputeAccess':
            baseDocument.statement = [{
                effect: "Allow",
                action: ["compute.instances.*"],
                resource: ["*"]
            }];
            break;
    }

    return baseDocument;
}

// Role-Policy Binding 목데이터 생성
function generateMockBindings() {
    const mockBindings = [
        // AWS Role Bindings - 동적 바인딩 생성
        {
            binding_id: "binding-aws-001-s3",
            role_id: "csp-role-aws-001",
            policy_id: "csp-policy-aws-s3",
            provider: "aws",
            status: "active",
            created_at: "2024-01-15T09:30:00Z"
        },
        {
            binding_id: "binding-aws-001-ec2",
            role_id: "csp-role-aws-001",
            policy_id: "csp-policy-aws-ec2",
            provider: "aws",
            status: "active",
            created_at: "2024-01-15T10:15:00Z"
        },
        {
            binding_id: "binding-aws-001-lambda",
            role_id: "csp-role-aws-001",
            policy_id: "csp-policy-aws-lambda",
            provider: "aws",
            status: "active",
            created_at: "2024-01-15T11:00:00Z"
        },
        // Azure Role Bindings
        {
            binding_id: "binding-azure-001-storage",
            role_id: "csp-role-azure-001",
            policy_id: "csp-policy-azure-storage",
            provider: "azure",
            status: "active",
            created_at: "2024-01-16T10:15:00Z"
        },
        // GCP Role Bindings
        {
            binding_id: "binding-gcp-001-compute",
            role_id: "csp-role-gcp-001",
            policy_id: "csp-policy-gcp-compute",
            provider: "gcp",
            status: "active",
            created_at: "2024-01-17T11:20:00Z"
        },
        {
            binding_id: "binding-gcp-001-storage",
            role_id: "csp-role-gcp-001",
            policy_id: "csp-policy-gcp-storage",
            provider: "gcp",
            status: "active",
            created_at: "2024-01-17T12:30:00Z"
        },
        // Alibaba Role Bindings
        {
            binding_id: "binding-alibaba-001-oss",
            role_id: "csp-role-alibaba-001",
            policy_id: "csp-policy-alibaba-oss",
            provider: "alibaba",
            status: "active",
            created_at: "2024-01-18T08:45:00Z"
        },
        // Tencent Role Bindings
        {
            binding_id: "binding-tencent-001-cos",
            role_id: "csp-role-tencent-001",
            policy_id: "csp-policy-tencent-cos",
            provider: "tencent",
            status: "active",
            created_at: "2024-01-19T14:30:00Z"
        },
        // NHN Role Bindings
        {
            binding_id: "binding-nhn-001-compute",
            role_id: "csp-role-nhn-001",
            policy_id: "csp-policy-nhn-compute",
            provider: "nhn",
            status: "active",
            created_at: "2024-01-23T10:30:00Z"
        },
        {
            binding_id: "binding-nhn-001-storage",
            role_id: "csp-role-nhn-001",
            policy_id: "csp-policy-nhn-storage",
            provider: "nhn",
            status: "active",
            created_at: "2024-01-23T11:45:00Z"
        }
    ];

    return mockBindings;
}

// ===== Mock Data Storage =====
let mockData = {
    roles: generateMockCspRoles(),
    policies: generateMockCspPolicies(),
    bindings: generateMockBindings()
};

// ===== Mock API Request Handler =====

// Mock API 요청 처리 함수
export function handleMockAPIRequest(controller, data = null) {
    // 실제 API 호출 시뮬레이션을 위한 지연
    const delay = 300 + Math.random() * 500;
    
    return new Promise((resolve) => {
        setTimeout(() => {
            let result;
            
            switch (controller) {
                case "/api/mc-iam-manager/GetCspRoleList":
                    result = handleGetCspRoleList(data);
                    break;
                case "/api/mc-iam-manager/GetCspRoleById":
                    result = handleGetCspRoleById(data);
                    break;
                case "/api/mc-iam-manager/CreateCspRole":
                    result = handleCreateCspRole(data);
                    break;
                case "/api/mc-iam-manager/UpdateCspRole":
                    result = handleUpdateCspRole(data);
                    break;
                case "/api/mc-iam-manager/DeleteCspRole":
                    result = handleDeleteCspRole(data);
                    break;
                case "/api/mc-iam-manager/GetCspPolicyList":
                    result = handleGetCspPolicyList(data);
                    break;
                case "/api/mc-iam-manager/GetCspPolicyById":
                    result = handleGetCspPolicyById(data);
                    break;
                case "/api/mc-iam-manager/CreateCspPolicy":
                    result = handleCreateCspPolicy(data);
                    break;
                case "/api/mc-iam-manager/DeleteCspPolicy":
                    result = handleDeleteCspPolicy(data);
                    break;
                case "/api/mc-iam-manager/GetPoliciesByRoleId":
                    result = handleGetPoliciesByRoleId(data);
                    break;
                case "/api/mc-iam-manager/BindPolicyToRole":
                    result = handleBindPolicyToRole(data);
                    break;
                case "/api/mc-iam-manager/UnbindPolicyFromRole":
                    result = handleUnbindPolicyFromRole(data);
                    break;
                case "/api/mc-iam-manager/GetCspProviders":
                    result = handleGetCspProviders();
                    break;
                case "/api/mc-iam-manager/SyncCspRoles":
                    result = handleSyncCspRoles(data);
                    break;
                case "/api/mc-iam-manager/SyncPolicies":
                    result = handleSyncPolicies(data);
                    break;
                case "/api/mc-iam-manager/UpdateCspPolicy":
                    result = handleUpdateCspPolicy(data);
                    break;
                default:
                    result = { error: "Unknown controller" };
            }
            
            // commonAPIPost와 동일한 응답 형식으로 반환
            resolve({
                data: {
                    responseData: result
                }
            });
        }, delay);
    });
}

// ===== Individual API Handlers =====

// CSP Roles 목록 조회
function handleGetCspRoleList(data) {
    const request = data?.Request || {};
    const provider = request.provider;
    const limit = request.limit || 50;
    const offset = request.offset || 0;
    
    let filteredRoles = mockData.roles;
    
    if (provider) {
        filteredRoles = filteredRoles.filter(role => role.provider === provider);
    }
    
    const startIndex = offset;
    const endIndex = Math.min(startIndex + limit, filteredRoles.length);
    const paginatedRoles = filteredRoles.slice(startIndex, endIndex);
    
    return {
        data: paginatedRoles,
        total: filteredRoles.length,
        limit: limit,
        offset: offset
    };
}

// 특정 CSP Role 조회
function handleGetCspRoleById(data) {
    const roleId = data?.pathParams?.roleId;
    const role = mockData.roles.find(r => r.id === roleId);
    
    if (!role) {
        throw new Error(`CSP Role with ID ${roleId} not found`);
    }
    
    return role;
}

// CSP Role 생성
function handleCreateCspRole(data) {
    const request = data?.Request || {};
    const newRole = {
        id: `csp-role-${request.provider}-${Date.now()}`,
        name: request.name,
        description: request.description || '',
        provider: request.provider,
        trust_policy: request.trust_policy || generateTrustPolicy(request.provider, 'User'),
        created_at: new Date().toISOString(),
        status: 'active',
        last_modified: new Date().toISOString()
    };
    
    mockData.roles.push(newRole);
    return newRole;
}

// CSP Role 수정
function handleUpdateCspRole(data) {
    const roleId = data?.pathParams?.roleId;
    const request = data?.Request || {};
    
    const roleIndex = mockData.roles.findIndex(r => r.id === roleId);
    if (roleIndex === -1) {
        throw new Error(`CSP Role with ID ${roleId} not found`);
    }
    
    const updatedRole = {
        ...mockData.roles[roleIndex],
        name: request.name || mockData.roles[roleIndex].name,
        description: request.description || mockData.roles[roleIndex].description,
        trust_policy: request.trust_policy || mockData.roles[roleIndex].trust_policy,
        last_modified: new Date().toISOString()
    };
    
    mockData.roles[roleIndex] = updatedRole;
    return updatedRole;
}

// CSP Role 삭제
function handleDeleteCspRole(data) {
    const roleId = data?.pathParams?.roleId;
    
    const roleIndex = mockData.roles.findIndex(r => r.id === roleId);
    if (roleIndex === -1) {
        throw new Error(`CSP Role with ID ${roleId} not found`);
    }
    
    // 관련 바인딩도 삭제
    mockData.bindings = mockData.bindings.filter(b => b.role_id !== roleId);
    
    const deletedRole = mockData.roles.splice(roleIndex, 1)[0];
    return { success: true, deletedRole };
}

// CSP Policies 목록 조회
function handleGetCspPolicyList(data) {
    const request = data?.Request || {};
    const provider = request.provider;
    const limit = request.limit || 50;
    const offset = request.offset || 0;
    
    let filteredPolicies = mockData.policies;
    
    if (provider) {
        filteredPolicies = filteredPolicies.filter(policy => policy.provider === provider);
    }
    
    const startIndex = offset;
    const endIndex = Math.min(startIndex + limit, filteredPolicies.length);
    const paginatedPolicies = filteredPolicies.slice(startIndex, endIndex);
    
    return {
        data: paginatedPolicies,
        total: filteredPolicies.length,
        limit: limit,
        offset: offset
    };
}

// 특정 CSP Policy 조회
function handleGetCspPolicyById(data) {
    const policyId = data?.pathParams?.policyId;
    const policy = mockData.policies.find(p => p.id === policyId);
    
    if (!policy) {
        throw new Error(`CSP Policy with ID ${policyId} not found`);
    }
    
    return policy;
}

// CSP Policy 생성
function handleCreateCspPolicy(data) {
    const request = data?.Request || {};
    
    // 중복 정책명 확인
    const existingPolicy = mockData.policies.find(p => p.name === request.name);
    if (existingPolicy) {
        // 기존 정책을 새 정책으로 교체
        const policyIndex = mockData.policies.findIndex(p => p.name === request.name);
        mockData.policies[policyIndex] = {
            id: existingPolicy.id, // 기존 ID 유지
            name: request.name,
            description: request.description || '',
            provider: request.provider || existingPolicy.provider,
            document: request.document || generatePolicyDocument('StorageAccess'),
            created_at: existingPolicy.created_at, // 기존 생성일 유지
            updated_at: new Date().toISOString(), // 업데이트 시간 추가
            status: 'active'
        };
        
        return { success: true, policy: mockData.policies[policyIndex], message: 'Policy updated successfully' };
    }
    
    // 새 정책 생성
    const newPolicy = {
        id: `csp-policy-${request.provider || 'unknown'}-${Date.now()}`,
        name: request.name,
        description: request.description || '',
        provider: request.provider || 'aws',
        document: request.document || generatePolicyDocument('StorageAccess'),
        created_at: new Date().toISOString(),
        status: 'active'
    };
    
    mockData.policies.push(newPolicy);
    return { success: true, policy: newPolicy, message: 'Policy created successfully' };
}

// CSP Policy 삭제
function handleDeleteCspPolicy(data) {
    const policyId = data?.pathParams?.policyId;
    
    const policyIndex = mockData.policies.findIndex(p => p.id === policyId);
    if (policyIndex === -1) {
        throw new Error(`CSP Policy with ID ${policyId} not found`);
    }
    
    // 관련 바인딩도 삭제
    mockData.bindings = mockData.bindings.filter(b => b.policy_id !== policyId);
    
    const deletedPolicy = mockData.policies.splice(policyIndex, 1)[0];
    return { success: true, deletedPolicy };
}

// 특정 Role에 바인딩된 Policies 조회
function handleGetPoliciesByRoleId(data) {
    const roleId = data?.pathParams?.roleId;
    
    // Role ID로 직접 찾기
    let roleBindings = mockData.bindings.filter(b => b.role_id === roleId && b.status === 'active');
    
    // Role ID로 찾지 못한 경우, Role Name으로 찾기 (동적 바인딩)
    if (roleBindings.length === 0) {
        // AWS-AdminRole에 대한 기본 Policy 바인딩 생성
        if (roleId && roleId.toString().length > 10) { // 실제 생성된 Role ID인 경우
            const awsPolicies = mockData.policies.filter(p => p.provider === 'aws');
            roleBindings = awsPolicies.map((policy, index) => ({
                binding_id: `binding-aws-dynamic-${index + 1}`,
                role_id: roleId,
                policy_id: policy.id,
                provider: 'aws',
                status: 'active',
                created_at: new Date().toISOString()
            }));
        }
    }
    
    const policies = roleBindings.map(binding => {
        const policy = mockData.policies.find(p => p.id === binding.policy_id);
        return {
            ...policy,
            binding_id: binding.binding_id,
            binding_status: binding.status,
            bound_at: binding.created_at
        };
    }).filter(policy => policy.id);
    
    return policies;
}

// Role에 Policy 바인딩
function handleBindPolicyToRole(data) {
    const request = data?.Request || {};
    const roleId = request.roleId;
    const policyId = request.policyId;
    
    const role = mockData.roles.find(r => r.id === roleId);
    const policy = mockData.policies.find(p => p.id === policyId);
    
    if (!role) {
        throw new Error(`CSP Role with ID ${roleId} not found`);
    }
    if (!policy) {
        throw new Error(`CSP Policy with ID ${policyId} not found`);
    }
    if (role.provider !== policy.provider) {
        throw new Error(`Provider mismatch: Role provider (${role.provider}) and Policy provider (${policy.provider}) must be the same`);
    }
    
    const existingBinding = mockData.bindings.find(b => b.role_id === roleId && b.policy_id === policyId);
    if (existingBinding) {
        if (existingBinding.status === 'active') {
            throw new Error(`Policy ${policyId} is already bound to role ${roleId}`);
        } else {
            existingBinding.status = 'active';
            existingBinding.created_at = new Date().toISOString();
            return existingBinding;
        }
    }
    
    const newBinding = {
        binding_id: `binding-${roleId}-${policyId}`,
        role_id: roleId,
        policy_id: policyId,
        provider: role.provider,
        status: 'active',
        created_at: new Date().toISOString()
    };
    
    mockData.bindings.push(newBinding);
    return newBinding;
}

// Role에서 Policy 언바인딩
function handleUnbindPolicyFromRole(data) {
    const request = data?.Request || {};
    const roleId = request.roleId;
    const policyId = request.policyId;
    
    const bindingIndex = mockData.bindings.findIndex(b => b.role_id === roleId && b.policy_id === policyId);
    if (bindingIndex === -1) {
        throw new Error(`No binding found between role ${roleId} and policy ${policyId}`);
    }
    
    mockData.bindings[bindingIndex].status = 'inactive';
    return { success: true, binding: mockData.bindings[bindingIndex] };
}

// 사용 가능한 CSP Providers 목록 조회
function handleGetCspProviders() {
    const providers = [...new Set(mockData.roles.map(role => role.provider))];
    return providers.map(provider => ({
        name: provider,
        displayName: provider.toUpperCase(),
        description: `${provider.toUpperCase()} Cloud Service Provider`,
        status: 'available'
    }));
}

// CSP Role 동기화
function handleSyncCspRoles(data) {
    const request = data?.Request || {};
    const provider = request.provider;
    
    // 동기화 시뮬레이션 - 실제로는 외부 CSP에서 최신 역할 목록을 가져옴
    const syncRoles = generateMockCspRoles();
    
    if (provider) {
        const filteredRoles = syncRoles.filter(role => role.provider === provider);
        // 기존 역할과 병합 (중복 제거)
        const existingRoleIds = mockData.roles.map(r => r.id);
        const newRoles = filteredRoles.filter(role => !existingRoleIds.includes(role.id));
        mockData.roles.push(...newRoles);
        
        return {
            success: true,
            message: `Synced ${newRoles.length} new roles for ${provider}`,
            syncedRoles: newRoles.length,
            totalRoles: mockData.roles.filter(r => r.provider === provider).length
        };
    } else {
        // 모든 Provider 동기화
        const existingRoleIds = mockData.roles.map(r => r.id);
        const newRoles = syncRoles.filter(role => !existingRoleIds.includes(role.id));
        mockData.roles.push(...newRoles);
        
        return {
            success: true,
            message: `Synced ${newRoles.length} new roles across all providers`,
            syncedRoles: newRoles.length,
            totalRoles: mockData.roles.length
        };
    }
}

// 정책 동기화
function handleSyncPolicies(data) {
    const request = data?.Request || {};
    const roleId = request.roleId;
    
    // 동기화 시뮬레이션 - 실제로는 외부 CSP에서 최신 정책 목록을 가져옴
    const syncPolicies = generateMockCspPolicies();
    
    if (roleId) {
        // 특정 역할의 정책 동기화
        const role = mockData.roles.find(r => r.id === roleId);
        if (!role) {
            throw new Error(`CSP Role with ID ${roleId} not found`);
        }
        
        const rolePolicies = syncPolicies.filter(policy => policy.provider === role.provider);
        const existingPolicyIds = mockData.policies.map(p => p.id);
        const newPolicies = rolePolicies.filter(policy => !existingPolicyIds.includes(policy.id));
        mockData.policies.push(...newPolicies);
        
        return {
            success: true,
            message: `Synced ${newPolicies.length} new policies for role ${roleId}`,
            syncedPolicies: newPolicies.length,
            roleId: roleId
        };
    } else {
        // 모든 정책 동기화
        const existingPolicyIds = mockData.policies.map(p => p.id);
        const newPolicies = syncPolicies.filter(policy => !existingPolicyIds.includes(policy.id));
        mockData.policies.push(...newPolicies);
        
        return {
            success: true,
            message: `Synced ${newPolicies.length} new policies`,
            syncedPolicies: newPolicies.length,
            totalPolicies: mockData.policies.length
        };
    }
}

// CSP Policy 업데이트
function handleUpdateCspPolicy(data) {
    const policyId = data?.pathParams?.policyId;
    const request = data?.Request || {};
    
    const policyIndex = mockData.policies.findIndex(p => p.id === policyId);
    if (policyIndex === -1) {
        throw new Error(`CSP Policy with ID ${policyId} not found`);
    }
    
    const updatedPolicy = {
        ...mockData.policies[policyIndex],
        name: request.name || mockData.policies[policyIndex].name,
        description: request.description || mockData.policies[policyIndex].description,
        document: request.document || mockData.policies[policyIndex].document,
        last_modified: new Date().toISOString()
    };
    
    mockData.policies[policyIndex] = updatedPolicy;
    return { success: true, policy: updatedPolicy };
}

// ===== Utility Functions =====

// 목데이터 초기화 (테스트용)
export function resetMockData() {
    mockData = {
        roles: generateMockCspRoles(),
        policies: generateMockCspPolicies(),
        bindings: generateMockBindings()
    };
}

// 목데이터 상태 조회 (디버깅용)
export function getMockDataStatus() {
    return {
        rolesCount: mockData.roles.length,
        policiesCount: mockData.policies.length,
        bindingsCount: mockData.bindings.length,
        activeBindingsCount: mockData.bindings.filter(b => b.status === 'active').length
    };
}
