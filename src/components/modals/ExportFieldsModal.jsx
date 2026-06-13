import React, { useState } from "react";
import { Modal, Checkbox, Button, Divider, Tag } from "antd";
import { DownloadOutlined, LoadingOutlined } from "@ant-design/icons";

const FIELD_LABELS = {
  student_id: "Student ID",
  student_name: "Student Name",
  highest_degree: "Highest Degree",
  completion_year: "Completion Year",
  current_profession: "Current Profession",
  current_role: "Current Role",
  work_experience: "Work Experience",
  student_age: "Age",
  objective: "Objective",
  counsellor_name_l2: "Counsellor Name",
  lead_status: "Lead Status",
  lead_sub_status: "Lead Sub Status",
  mode: "Mode",
  source: "Source",
  source_url: "Source URL",
  utm_campaign: "UTM Campaign",
  utm_source: "UTM Source",
  utm_medium: "UTM Medium",
  utm_keyword: "UTM Keyword",
  calling_status: "Calling Status",
  sub_calling_status: "Sub Calling Status",
  remark: "Remark",
  total_remarks: "Total Remarks",
  is_connected_yet: "Is Connected Yet",
  next_call_time: "Next Call Time",
  preferred_stream: "Preferred Stream",
  preferred_degree: "Preferred Degree",
  preferred_level: "Preferred Level",
  preferred_city: "Preferred City",
  preferred_state: "Preferred State",
  preferred_budget: "Preferred Budget",
  current_city: "Current City",
  current_state: "Current State",
  created_at: "Created At",
  next_call_date: "Next Call Date",
  last_call_date: "Last Call Date",
  first_callback_l2: "First Callback",
  first_form_filled_date: "First Form Filled Date",
  first_call_date_l2: "First Call Date",
  first_icc_date: "First ICC Date",
  admission_date: "Admission Date",
  total_connected_calls: "Total Connected Calls",
  is_pre_ni: "Is Pre NI",
  is_reactivity: "Is Reactivity",
  number_of_unread_messages: "Unread Messages",
};

const FIELD_GROUPS = [
  {
    label: "Student Info",
    color: "blue",
    fields: [
      "student_id", "student_name", "highest_degree", "completion_year",
      "current_profession", "current_role", "work_experience", "student_age", "objective",
    ],
  },
  {
    label: "Lead Info",
    color: "purple",
    fields: ["counsellor_name_l2", "lead_status", "lead_sub_status", "mode"],
  },
  {
    label: "Source & UTM",
    color: "cyan",
    fields: ["source", "source_url", "utm_campaign", "utm_source", "utm_medium", "utm_keyword"],
  },
  {
    label: "Preferences",
    color: "geekblue",
    fields: [
      "preferred_stream", "preferred_degree", "preferred_level",
      "preferred_city", "preferred_state", "preferred_budget",
      "current_city", "current_state",
    ],
  },
  {
    label: "Call & Remarks",
    color: "orange",
    fields: ["calling_status", "sub_calling_status", "remark", "total_remarks", "is_connected_yet", "next_call_time"],
  },
  {
    label: "Dates & Milestones",
    color: "green",
    fields: [
      "created_at", "next_call_date", "last_call_date",
      "first_callback_l2", "first_form_filled_date",
      "first_call_date_l2", "first_icc_date", "admission_date",
    ],
  },
  {
    label: "Stats",
    color: "volcano",
    fields: ["total_connected_calls", "is_pre_ni", "is_reactivity", "number_of_unread_messages"],
  },
];

const ALL_FIELDS = FIELD_GROUPS.flatMap((g) => g.fields);

export default function ExportFieldsModal({ open, onClose, onExport, isExporting }) {
  const [selected, setSelected] = useState(() => new Set(ALL_FIELDS));

  const allChecked = selected.size === ALL_FIELDS.length;
  const noneChecked = selected.size === 0;

  const toggleAll = () => {
    setSelected(allChecked ? new Set() : new Set(ALL_FIELDS));
  };

  const toggleGroup = (groupFields) => {
    const allGroupSelected = groupFields.every((f) => selected.has(f));
    setSelected((prev) => {
      const next = new Set(prev);
      if (allGroupSelected) {
        groupFields.forEach((f) => next.delete(f));
      } else {
        groupFields.forEach((f) => next.add(f));
      }
      return next;
    });
  };

  const toggleField = (field) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(field) ? next.delete(field) : next.add(field);
      return next;
    });
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={
        <div className="flex items-center justify-between pr-4">
          <span className="text-base font-semibold">Select Fields to Export</span>
          <Tag color={noneChecked ? "red" : "blue"}>
            {selected.size} / {ALL_FIELDS.length} selected
          </Tag>
        </div>
      }
      width={720}
      footer={
        <div className="flex justify-between items-center">
          <Checkbox
            checked={allChecked}
            indeterminate={!allChecked && !noneChecked}
            onChange={toggleAll}
          >
            <span className="font-medium">
              {allChecked ? "Deselect All" : "Select All"}
            </span>
          </Checkbox>
          <div className="flex gap-2">
            <Button onClick={onClose} disabled={isExporting}>
              Cancel
            </Button>
            <Button
              type="primary"
              icon={isExporting ? <LoadingOutlined spin /> : <DownloadOutlined />}
              onClick={() => onExport(Array.from(selected))}
              disabled={noneChecked || isExporting}
              loading={isExporting}
            >
              {isExporting ? "Exporting..." : `Export ${selected.size} Fields`}
            </Button>
          </div>
        </div>
      }
      styles={{ body: { maxHeight: "65vh", overflowY: "auto", padding: "12px 24px" } }}
    >
      <div className="flex flex-col gap-4">
        {FIELD_GROUPS.map((group) => {
          const groupSelected = group.fields.filter((f) => selected.has(f)).length;
          const allGroupChecked = groupSelected === group.fields.length;
          const someGroupChecked = groupSelected > 0 && !allGroupChecked;

          return (
            <div key={group.label} className="border border-gray-100 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Checkbox
                  checked={allGroupChecked}
                  indeterminate={someGroupChecked}
                  onChange={() => toggleGroup(group.fields)}
                />
                <Tag color={group.color} style={{ margin: 0, fontSize: 12, fontWeight: 600 }}>
                  {group.label}
                </Tag>
                <span className="text-xs text-gray-400 ml-auto">
                  {groupSelected}/{group.fields.length}
                </span>
              </div>
              <Divider style={{ margin: "6px 0" }} />
              <div className="grid grid-cols-3 gap-y-2 gap-x-3">
                {group.fields.map((field) => (
                  <Checkbox
                    key={field}
                    checked={selected.has(field)}
                    onChange={() => toggleField(field)}
                  >
                    <span className="text-xs">{FIELD_LABELS[field]}</span>
                  </Checkbox>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
