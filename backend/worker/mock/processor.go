// Code generated by MockGen. DO NOT EDIT.
// Source: github.com/mrkrabopl1/go_db/worker (interfaces: TaskProcessor)

// Package mockwk is a generated GoMock package.
package mockwk

import (
	context "context"
	reflect "reflect"

	gomock "github.com/golang/mock/gomock"
	asynq "github.com/hibiken/asynq"
	db "github.com/mrkrabopl1/go_db/db/sqlc"
)

// MockTaskProcessor is a mock of TaskProcessor interface.
type MockTaskProcessor struct {
	ctrl     *gomock.Controller
	recorder *MockTaskProcessorMockRecorder
}

// MockTaskProcessorMockRecorder is the mock recorder for MockTaskProcessor.
type MockTaskProcessorMockRecorder struct {
	mock *MockTaskProcessor
}

// NewMockTaskProcessor creates a new mock instance.
func NewMockTaskProcessor(ctrl *gomock.Controller) *MockTaskProcessor {
	mock := &MockTaskProcessor{ctrl: ctrl}
	mock.recorder = &MockTaskProcessorMockRecorder{mock}
	return mock
}

// EXPECT returns an object that allows the caller to indicate expected use.
func (m *MockTaskProcessor) EXPECT() *MockTaskProcessorMockRecorder {
	return m.recorder
}

// GetSnickersInfo mocks base method.
func (m *MockTaskProcessor) GetSnickersInfo(arg0 context.Context, arg1 string) (db.SnickersInfoResponse, error) {
	m.ctrl.T.Helper()
	ret := m.ctrl.Call(m, "GetSnickersInfo", arg0, arg1)
	ret0, _ := ret[0].(db.SnickersInfoResponse)
	ret1, _ := ret[1].(error)
	return ret0, ret1
}

// GetSnickersInfo indicates an expected call of GetSnickersInfo.
func (mr *MockTaskProcessorMockRecorder) GetSnickersInfo(arg0, arg1 interface{}) *gomock.Call {
	mr.mock.ctrl.T.Helper()
	return mr.mock.ctrl.RecordCallWithMethodType(mr.mock, "GetSnickersInfo", reflect.TypeOf((*MockTaskProcessor)(nil).GetSnickersInfo), arg0, arg1)
}

// ProcessTaskSendOrderEmail mocks base method.
func (m *MockTaskProcessor) ProcessTaskSendOrderEmail(arg0 context.Context, arg1 *asynq.Task) error {
	m.ctrl.T.Helper()
	ret := m.ctrl.Call(m, "ProcessTaskSendOrderEmail", arg0, arg1)
	ret0, _ := ret[0].(error)
	return ret0
}

// ProcessTaskSendOrderEmail indicates an expected call of ProcessTaskSendOrderEmail.
func (mr *MockTaskProcessorMockRecorder) ProcessTaskSendOrderEmail(arg0, arg1 interface{}) *gomock.Call {
	mr.mock.ctrl.T.Helper()
	return mr.mock.ctrl.RecordCallWithMethodType(mr.mock, "ProcessTaskSendOrderEmail", reflect.TypeOf((*MockTaskProcessor)(nil).ProcessTaskSendOrderEmail), arg0, arg1)
}

// ProcessTaskSendVerifyEmail mocks base method.
func (m *MockTaskProcessor) ProcessTaskSendVerifyEmail(arg0 context.Context, arg1 *asynq.Task) error {
	m.ctrl.T.Helper()
	ret := m.ctrl.Call(m, "ProcessTaskSendVerifyEmail", arg0, arg1)
	ret0, _ := ret[0].(error)
	return ret0
}

// ProcessTaskSendVerifyEmail indicates an expected call of ProcessTaskSendVerifyEmail.
func (mr *MockTaskProcessorMockRecorder) ProcessTaskSendVerifyEmail(arg0, arg1 interface{}) *gomock.Call {
	mr.mock.ctrl.T.Helper()
	return mr.mock.ctrl.RecordCallWithMethodType(mr.mock, "ProcessTaskSendVerifyEmail", reflect.TypeOf((*MockTaskProcessor)(nil).ProcessTaskSendVerifyEmail), arg0, arg1)
}

// SetSnickersInfo mocks base method.
func (m *MockTaskProcessor) SetSnickersInfo(arg0 context.Context, arg1 string, arg2 db.SnickersInfoResponse) error {
	m.ctrl.T.Helper()
	ret := m.ctrl.Call(m, "SetSnickersInfo", arg0, arg1, arg2)
	ret0, _ := ret[0].(error)
	return ret0
}

// SetSnickersInfo indicates an expected call of SetSnickersInfo.
func (mr *MockTaskProcessorMockRecorder) SetSnickersInfo(arg0, arg1, arg2 interface{}) *gomock.Call {
	mr.mock.ctrl.T.Helper()
	return mr.mock.ctrl.RecordCallWithMethodType(mr.mock, "SetSnickersInfo", reflect.TypeOf((*MockTaskProcessor)(nil).SetSnickersInfo), arg0, arg1, arg2)
}

// Shutdown mocks base method.
func (m *MockTaskProcessor) Shutdown() {
	m.ctrl.T.Helper()
	m.ctrl.Call(m, "Shutdown")
}

// Shutdown indicates an expected call of Shutdown.
func (mr *MockTaskProcessorMockRecorder) Shutdown() *gomock.Call {
	mr.mock.ctrl.T.Helper()
	return mr.mock.ctrl.RecordCallWithMethodType(mr.mock, "Shutdown", reflect.TypeOf((*MockTaskProcessor)(nil).Shutdown))
}

// Start mocks base method.
func (m *MockTaskProcessor) Start() error {
	m.ctrl.T.Helper()
	ret := m.ctrl.Call(m, "Start")
	ret0, _ := ret[0].(error)
	return ret0
}

// Start indicates an expected call of Start.
func (mr *MockTaskProcessorMockRecorder) Start() *gomock.Call {
	mr.mock.ctrl.T.Helper()
	return mr.mock.ctrl.RecordCallWithMethodType(mr.mock, "Start", reflect.TypeOf((*MockTaskProcessor)(nil).Start))
}
