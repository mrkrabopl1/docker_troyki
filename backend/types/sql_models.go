package types

type ExecuteSQLRequest struct {
	Query string `json:"query" binding:"required"`
}

type SQLExecutionMode string

const (
	SQLModeReadOnly SQLExecutionMode = "readonly"
	SQLModeWrite    SQLExecutionMode = "write"
	SQLModeDDL      SQLExecutionMode = "ddl"
	SQLModeAll      SQLExecutionMode = "all"
)

type SQLValidationResult struct {
	Valid      bool               `json:"valid"`
	Mode       SQLExecutionMode   `json:"mode"`
	Operations []SQLOperationInfo `json:"operations"`
	Errors     []string           `json:"errors,omitempty"`
	Warnings   []string           `json:"warnings,omitempty"`
}

type SQLOperationInfo struct {
	Type         string `json:"type"`
	Table        string `json:"table"`
	RowsAffected int64  `json:"rowsAffected,omitempty"`
	Status       string `json:"status"`
	Message      string `json:"message,omitempty"`
}

type ExecuteSQLResponse struct {
	Success    bool                `json:"success"`
	Validation SQLValidationResult `json:"validation"`
	Operations []SQLOperationInfo  `json:"operations"`
	Summary    ExecuteSummary      `json:"summary"`
	TotalTime  string              `json:"totalTime"`
	Error      string              `json:"error,omitempty"`
}

type ExecuteSummary struct {
	TotalQueries     int            `json:"totalQueries"`
	Successful       int            `json:"successful"`
	Failed           int            `json:"failed"`
	Skipped          int            `json:"skipped"`
	TablesAffected   map[string]int `json:"tablesAffected"`
	OperationsByType map[string]int `json:"operationsByType"`
}

type ParsedQuery struct {
	Query   string
	Comment string
}
