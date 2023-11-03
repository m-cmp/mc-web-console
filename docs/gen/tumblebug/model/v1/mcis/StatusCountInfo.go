package mcis

type StatusCountInfo struct {
	CountRebooting		`json:"countRebooting"`
	CountTerminated		`json:"countTerminated"`
	CountTerminating		`json:"countTerminating"`
	CountTotal		`json:"countTotal"`
	CountCreating		`json:"countCreating"`
	CountFailed		`json:"countFailed"`
	CountResuming		`json:"countResuming"`
	CountRunning		`json:"countRunning"`
	CountSuspended		`json:"countSuspended"`
	CountSuspending		`json:"countSuspending"`
	CountUndefined		`json:"countUndefined"`
}