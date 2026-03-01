import React, { useState, useEffect } from "react";
import { UserCog } from "lucide-react";
import Modal from "../../common/Modal";

const SupervisorModal = ({
  isOpen,
  onClose,
  onConfirm,
  user,
  supervisors,
  selectedSupervisorId,
  setSelectedSupervisorId,
  users = [],
  loading = false,
}) => {
  const [localSelectedSupervisorId, setLocalSelectedSupervisorId] = useState(selectedSupervisorId);

  // Sync local state with prop
  useEffect(() => {
    if (isOpen) {
      setLocalSelectedSupervisorId(selectedSupervisorId);
    }
  }, [isOpen, selectedSupervisorId]);

  if (!user) return null;

  const selectedSupervisor = supervisors.find(
    (s) => s.counsellor_id === localSelectedSupervisorId
  );

  const isNoChange = localSelectedSupervisorId === user?.assigned_to;

  const handleConfirm = () => {
    // Update parent state first
    setSelectedSupervisorId(localSelectedSupervisorId);
    // Then call onConfirm
    onConfirm();
  };

  const handleClose = () => {
    // Reset to original value when closing without confirming
    setLocalSelectedSupervisorId(selectedSupervisorId);
    onClose();
  };

  const handleSelectChange = (e) => {
    const newValue = e.target.value;
    setLocalSelectedSupervisorId(newValue);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      onConfirm={handleConfirm}
      title="Change Supervisor"
      icon={UserCog}
      iconColor="blue"
      size="xl"
      height="xl"
      confirmText={isNoChange ? "No Changes" : "Update Supervisor"}
      cancelText="Cancel"
      confirmColor={isNoChange ? "gray" : "blue"}
      loading={loading}
      loadingText="Updating..."
      disableConfirm={isNoChange}
    >
      {/* Subtitle under title */}
      <p className="text-sm text-gray-500">
        Assign a supervisor to this counsellor
      </p>

      {/* User Info */}
      <div className="mt-2 bg-gray-50 rounded-lg p-4">
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
            {user?.counsellor_name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div className="ml-3">
            <div className="text-sm font-medium text-gray-900">
              {user?.counsellor_name}
            </div>
            <div className="text-xs text-gray-500">
              {user?.counsellor_email} • {user?.role?.toUpperCase()}
            </div>
          </div>
        </div>
        {user?.supervisor_name && (
          <div className="mt-3 text-sm text-gray-600">
            <span className="font-medium">Current Supervisor:</span>{" "}
            {user.supervisor_name}
          </div>
        )}
      </div>

      {/* Supervisor Selection */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select New Supervisor
        </label>
        <div className="relative">
          <select
            value={localSelectedSupervisorId}
            onChange={handleSelectChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white"
          >
            <option value="">No Supervisor (Unassigned)</option>
            {supervisors
              .filter((sup) => sup.counsellor_id !== user?.counsellor_id)
              .map((supervisor) => (
                <option
                  key={supervisor.counsellor_id}
                  value={supervisor.counsellor_id}
                >
                  {supervisor.counsellor_name} • {supervisor.counsellor_id} •{" "}
                  {supervisor.role?.toUpperCase()}
                </option>
              ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
            <svg
              className="fill-current h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
            >
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
            </svg>
          </div>
        </div>

        {/* Supervisor Details */}
        {selectedSupervisor && (
          <div className="mt-4 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mr-3">
                <UserCog className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-medium text-indigo-900">
                  {selectedSupervisor.counsellor_name}
                </div>
                <div className="text-xs text-indigo-700">
                  {selectedSupervisor.counsellor_email}
                </div>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="text-gray-600">Status:</div>
              <div className="font-medium text-gray-900">
                <span
                  className={`inline-flex px-2 py-0.5 rounded-full ${selectedSupervisor.status === "active"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                    }`}
                >
                  {selectedSupervisor.status === "active"
                    ? "Active"
                    : "Inactive"}
                </span>
              </div>
              <div className="text-gray-600">Mode:</div>
              <div className="font-medium text-gray-900">
                {selectedSupervisor.counsellor_preferred_mode || "Regular"}
              </div>
              <div className="text-gray-600">Assigned Counsellors:</div>
              <div className="font-medium text-gray-900">
                {users.filter(
                  (u) => u.assigned_to === selectedSupervisor.counsellor_id
                ).length || 0}
              </div>
            </div>
          </div>
        )}

        {/* Unassign Warning */}
        {!localSelectedSupervisorId && user?.supervisor_name && (
          <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-100">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-yellow-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Removing Supervisor Assignment
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    This counsellor will be unassigned from their current
                    supervisor. They will not have a supervisor until you assign
                    one.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default SupervisorModal;