import React, { useEffect, useState, useRef } from "react";
import { Tag, Play, Pause } from "lucide-react";
import PaymentStatus from "./PaymentStatus";

const ActivityRemarkstabs = ({ studentId, student }) => {
  const [activeTab, setActiveTab] = useState("all");
  const [remarks, setRemarks] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [playingAudio, setPlayingAudio] = useState(null);
  const audioRefs = useRef({});

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleAudioPlay = (audioId, audioUrl) => {
    if (playingAudio && playingAudio !== audioId) {
      const currentAudio = audioRefs.current[playingAudio];
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }
    }
    if (!audioRefs.current[audioId]) {
      audioRefs.current[audioId] = new Audio(audioUrl);
      audioRefs.current[audioId].addEventListener("ended", () => {
        setPlayingAudio(null);
      });
    }

    const audio = audioRefs.current[audioId];

    if (playingAudio === audioId) {
      audio.pause();
      setPlayingAudio(null);
    } else {
      audio.play().catch(console.error);
      setPlayingAudio(audioId);
    }
  };

  const AudioPlayer = ({ audioUrl, audioId }) => {
    if (!audioUrl) return null;

    return (
      <button
        onClick={() => handleAudioPlay(audioId, audioUrl)}
        className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors mt-2"
      >
        {playingAudio === audioId ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
        <span className="text-sm font-medium">
          {playingAudio === audioId ? "Pause" : "Play"} Recording
        </span>
      </button>
    );
  };

  // Helper function to parse student comments
  const parseStudentComments = (comments) => {
    if (!comments) return [];

    try {
      // Check if it's already an array
      if (Array.isArray(comments)) return comments;

      // Check if it's a JSON string
      if (typeof comments === "string") {
        const parsed = JSON.parse(comments);
        return Array.isArray(parsed) ? parsed : [];
      }

      return [];
    } catch (error) {
      console.error("Error parsing student comments:", error);
      return [];
    }
  };

  const renderRemarks = () => {
    const remarksArray = Array.isArray(student?.student_remarks)
      ? student?.student_remarks
      : [];

    if (remarksArray.length === 0) {
      return (
        <div className="text-gray-500 text-center py-4">No remarks found</div>
      );
    }

    return (
      <div className="space-y-4">
        {[...remarksArray]
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .map((remark, index) => (
            <div
              key={index}
              className="border rounded-lg p-4 border-gray-200 grid grid-cols-3 gap-4 items-start mb-3"
            >
              <div className="flex flex-col items-center w-24">
                <div className="text-sm text-black">
                  {new Date(remark.created_at).toLocaleDateString()}
                </div>
                <div className="text-xs text-black">
                  {new Date(remark.created_at).toLocaleTimeString()}
                </div>
              </div>
              <div className="flex items-center text-sm text-black w-24">
                <span className="text-nowrap">
                  {remark?.counsellor?.counsellor_name ||
                    remark?.supervisor?.supervisor_name}
                </span>
              </div>
              <div className="flex flex-col">
                <div className="flex flex-wrap gap-2 mb-2">
                  {remark.calling_status && (
                    <div className="px-2 py-1 bg-gray-100 font-semibold text-gray-800 text-sm rounded-full flex items-center">
                      <Tag className="h-3 w-3 mr-1" />
                      {remark.calling_status}
                    </div>
                  )}
                  {remark.sub_calling_status && (
                    <div className="px-2 py-1 bg-gray-100 font-semibold text-gray-800 text-sm rounded-full flex items-center">
                      <Tag className="h-3 w-3 mr-1" />
                      {remark.sub_calling_status}
                    </div>
                  )}
                  {remark.callback_date && remark.callback_time && (
                    <div className="px-2 py-1 bg-gray-100 font-semibold text-gray-800 text-sm rounded-full flex items-center">
                      <Tag className="h-3 w-3 mr-1" />
                      {new Date(remark.callback_date).toLocaleDateString(
                        "en-GB",
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        },
                      ) +
                        " " +
                        remark.callback_time}
                    </div>
                  )}
                </div>
                <div className="text-lg break-words whitespace-pre-wrap font-normal">
                  {remark.remarks}
                </div>
                <AudioPlayer
                  audioUrl={remark.call_recording_url}
                  audioId={`remark-${index}`}
                />
              </div>
            </div>
          ))}
      </div>
    );
  };

  const renderActivities = () => {
    if (!student.lead_activities || student.lead_activities.length === 0) {
      return (
        <div className="text-gray-500 text-center py-4">
          No activities found
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {student?.lead_activities.map((activity, index) => {
          const studentComments = parseStudentComments(
            activity.student_comment,
          );

          return (
            <div key={index} className="border rounded-lg p-4 border-gray-200">
              <div className="grid grid-cols-3 gap-4 items-start mb-3">
                {/* Date and Time */}
                <div className="flex flex-col items-center w-24 flex-shrink-0">
                  <div className="text-sm text-black">
                    {new Date(activity.created_at).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-black">
                    {new Date(activity.updated_at).toLocaleTimeString()}
                  </div>
                </div>

                <div className="flex items-center text-sm text-black w-24 flex-shrink-0">
                  System
                </div>

                {/* Activity details */}
                <div className="flex flex-col min-w-0">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {activity.source && (
                      <div className="px-2 py-1 bg-gray-100 font-semibold text-gray-800 text-sm rounded-full flex items-center">
                        <Tag className="h-3 w-3 mr-1" />
                        {activity.source}
                      </div>
                    )}
                    {activity.utm_campaign && (
                      <div className="px-2 py-1 bg-gray-100 font-semibold text-gray-800 text-sm rounded-full flex items-center">
                        <Tag className="h-3 w-3 mr-1" />
                        {activity.utm_campaign}
                      </div>
                    )}
                  </div>
                  <div className="text-lg break-words font-normal">
                    {activity.source_url}
                  </div>
                  <AudioPlayer
                    audioUrl={activity.call_recording_url}
                    audioId={`activity-${index}`}
                  />
                </div>
              </div>

              {/* Student Comments Section */}
              {studentComments.length > 0 && (
                <div className="space-y-2 mt-3">
                  {studentComments.map((comment, commentIndex) => (
                    <div
                      key={commentIndex}
                      className="px-3 py-2 bg-gray-100 text-gray-800 text-sm rounded-md"
                    >
                      <div className="font-semibold break-words">
                        {comment.question}
                      </div>
                      <div className="text-gray-600 break-words">
                        {comment.answer?.trim() ? comment.answer : "N/A"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderCredentials = () => {
    if (loading) {
      return (
        <div className="text-gray-500 text-center py-4">
          Loading credentials...
        </div>
      );
    }

    if (
      !student?.collegeCredentials ||
      student?.collegeCredentials.length === 0
    ) {
      return (
        <div className="text-gray-500 text-center py-4">
          No credentials found
        </div>
      );
    }

    const credentials = Array.isArray(student?.collegeCredentials)
      ? student.collegeCredentials
      : [];

    return (
      <div className="space-y-4">
        {credentials.map((credential, index) => (
          <div key={index} className="border rounded-lg p-4 border-gray-200">
            <div className="grid grid-cols-12 gap-4 items-start mb-3">
              <div className="flex flex-col col-span-3 items-center w-52 flex-shrink-0 items-start">
                <div className="text-sm text-black">
                  {new Date(
                    credential?.created_at || credential?.createdAt,
                  ).toLocaleDateString()}
                </div>
                <div className="text-xs text-black">
                  {new Date(
                    credential?.created_at || credential?.createdAt,
                  ).toLocaleTimeString()}
                </div>
                <div className="flex gap-2 mt-2">
                  <span className="text-sm">Assigned To:-</span>{" "}
                  {credential?.l3_counsellor_details?.counsellor_name && (
                    <span className="text-nowrap text-sm text-gray-600">
                      {credential.l3_counsellor_details.counsellor_name ||
                        "Supervisor"}
                    </span>
                  )}
                </div>
              </div>

              {/* Counsellor Name */}
              <div className="flex items-center col-span-3 text-sm text-black w-24 flex-shrink-0">
                <span className="text-nowrap">
                  {credential?.assignedCounsellor?.counsellor_name ||
                    "Supervisor"}
                </span>
              </div>

              {/* Credentials Details */}
              <div className="flex flex-col col-span-6 grid-cols-6 min-w-0">
                {/* College Name Tag */}
                {credential?.enrolledCourse && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    <div className="px-2 py-1 bg-blue-100 font-semibold text-blue-800 text-sm rounded-full flex items-center">
                      <Tag className="h-3 w-3 mr-1" />
                      {credential?.enrolledCourse?.university_name}
                    </div>
                  </div>
                )}

                {/* Credentials Table */}
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <tbody>
                      <tr className="border-b border-gray-200">
                        <td className="px-3 py-2 font-medium text-gray-600 bg-gray-50 w-1/3">
                          Form ID:
                        </td>
                        <td className="px-3 py-2 text-gray-800 break-all">
                          {credential.form_id || "N/A"}
                        </td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="px-3 py-2 font-medium text-gray-600 bg-gray-50 w-1/3">
                          Coupon Code:
                        </td>
                        <td className="px-3 py-2 text-gray-800 break-all">
                          {credential.coupon_code || "N/A"}
                        </td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="px-3 py-2 font-medium text-gray-600 bg-gray-50 w-1/3">
                          Username:
                        </td>
                        <td className="px-3 py-2 text-gray-800 break-all">
                          {credential.user_name || "N/A"}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-medium text-gray-600 bg-gray-50 w-1/3">
                          Password:
                        </td>
                        <td className="px-3 py-2 text-gray-800 break-all">
                          {credential.password || "N/A"}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-medium text-gray-600 bg-gray-50 w-1/3">
                          Course Name:
                        </td>
                        <td className="px-3 py-2 text-gray-800 break-all">
                          {credential?.enrolledCourse?.course_name || "N/A"}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderPayments = () => {
    if (!student?.payments || student.payments.length === 0) {
      return (
        <div className="text-gray-500 text-center py-4">
          No payment records found
        </div>
      );
    }

    const payments = Array.isArray(student.payments) ? student.payments : [];

    return (
      <div className="space-y-4">
        {payments
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .map((payment, index) => (
            <div
              key={index}
              className="border rounded-lg p-4 border-gray-200 grid grid-cols-3 gap-4 items-start mb-3"
            >
              <div className="flex flex-col items-center w-24">
                <div className="text-sm text-black">
                  {new Date(payment.created_at).toLocaleDateString()}
                </div>
                <div className="text-xs text-black">
                  {new Date(payment.created_at).toLocaleTimeString()}
                </div>
              </div>

              <div className="flex items-center text-sm text-black w-24">
                <span className="text-nowrap">System</span>
              </div>

              <div className="flex flex-col">
                <div className="text-lg break-words font-normal">
                  {payment.payment_for === "application" ? "Form" : "Admission"}{" "}
                  initiated for{" "}
                  <span className="font-semibold">{payment.college_name}</span>{" "}
                  for{" "}
                  <span className="font-semibold">{payment.course_name}</span>
                  {payment.status === "COMPLETED" && (
                    <span className="text-green-600">
                      {" "}
                      - Payment Successful (₹{payment.final_amount})
                    </span>
                  )}
                  {payment.status === "PENDING" && (
                    <span className="text-orange-600">
                      {" "}
                      - Payment Pending (₹{payment.final_amount})
                    </span>
                  )}
                  {payment.status === "FAILED" && (
                    <span className="text-red-600">
                      {" "}
                      - Payment Failed (₹{payment.final_amount})
                    </span>
                  )}
                </div>
                {payment.couponCode && (
                  <div className="text-sm text-gray-600 mt-1">
                    Coupon applied:{" "}
                    <span className="font-medium">{payment.couponCode}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
      </div>
    );
  };

  const renderCombined = () => {
    const remarksArray = Array.isArray(student?.student_remarks)
      ? student?.student_remarks
      : [];
    const activitiesArray = Array.isArray(student.lead_activities)
      ? student.lead_activities
      : [];
    const credentialsArray = Array.isArray(student?.collegeCredentials)
      ? student.collegeCredentials
      : [];

    if (
      remarksArray.length === 0 &&
      activitiesArray.length === 0 &&
      credentialsArray.length === 0
    ) {
      return (
        <div className="text-gray-500 text-center py-4">No data found</div>
      );
    }

    const formattedRemarks = remarksArray.map((remark, index) => ({
      type: "remark",
      date: new Date(remark.updated_at),
      data: remark,
      originalIndex: index,
    }));

    const formattedActivities = activitiesArray.map((activity, index) => ({
      type: "activity",
      date: new Date(activity.created_at),
      data: activity,
      originalIndex: index,
    }));

    const formattedCredentials = credentialsArray.map((credential, index) => ({
      type: "credential",
      date: new Date(credential?.created_at || credential?.createdAt),
      data: credential,
      originalIndex: index,
    }));

    const combined = [
      ...formattedRemarks,
      ...formattedActivities,
      ...formattedCredentials,
    ].sort((a, b) => b.date - a.date);

    return (
      <div className="space-y-4">
        {combined.map((item, index) => {
          if (item.type === "remark") {
            const remark = item.data;
            return (
              <div
                key={`remark-${item.originalIndex}`}
                className="border rounded-lg p-4 border-gray-200 grid grid-cols-3 gap-4 items-start mb-3"
              >
                <div className="flex flex-col items-center w-24 flex-shrink-0">
                  <div className="text-sm text-black">
                    {item.date.toLocaleDateString()}
                  </div>
                  <div className="text-xs text-black">
                    {item.date.toLocaleTimeString()}
                  </div>
                </div>

                <div className="flex items-center text-sm text-black w-24 flex-shrink-0">
                  <span className="text-nowrap">
                    {remark?.counsellor?.counsellor_name ||
                      remark?.supervisor?.supervisor_name}
                  </span>
                </div>

                <div className="flex flex-col min-w-0">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {remark.calling_status && (
                      <div className="px-2 py-1 bg-gray-100 font-semibold text-gray-800 text-sm rounded-full flex items-center">
                        <Tag className="h-3 w-3 mr-1" />
                        {remark.calling_status}
                      </div>
                    )}
                    {remark.sub_calling_status && (
                      <div className="px-2 py-1 bg-gray-100 font-semibold text-gray-800 text-sm rounded-full flex items-center">
                        <Tag className="h-3 w-3 mr-1" />
                        {remark.sub_calling_status}
                      </div>
                    )}
                    {remark.callback_date && remark.callback_time && (
                      <div className="px-2 py-1 bg-gray-100 font-semibold text-gray-800 text-sm rounded-full flex items-center">
                        <Tag className="h-3 w-3 mr-1" />
                        {new Date(remark.callback_date).toLocaleDateString(
                          "en-GB",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          },
                        ) +
                          " " +
                          remark.callback_time}
                      </div>
                    )}
                  </div>
                  <div className="text-lg break-words whitespace-pre-wrap font-normal">
                    {remark.remarks}
                  </div>
                  <AudioPlayer
                    audioUrl={remark.call_recording_url}
                    audioId={`combined-remark-${item.originalIndex}`}
                  />
                </div>
              </div>
            );
          } else if (item.type === "activity") {
            const activity = item.data;
            const studentComments = parseStudentComments(
              activity.student_comment,
            );

            return (
              <div
                key={`activity-${item.originalIndex}`}
                className="border rounded-lg p-4 border-gray-200"
              >
                <div className="grid grid-cols-3 gap-4 items-start mb-3">
                  <div className="flex flex-col items-center w-24 flex-shrink-0">
                    <div className="text-sm text-black">
                      {item.date.toLocaleDateString()}
                    </div>
                    <div className="text-xs text-black">
                      {item.date.toLocaleTimeString()}
                    </div>
                  </div>

                  <div className="flex items-center text-sm text-black w-24 flex-shrink-0">
                    System
                  </div>

                  <div className="flex flex-col min-w-0">
                    <div className="flex flex-wrap gap-2 mb-2">
                      {activity.source && (
                        <div className="px-2 py-1 bg-gray-100 font-semibold text-gray-800 text-sm rounded-full flex items-center">
                          <Tag className="h-3 w-3 mr-1" />
                          {activity.source}
                        </div>
                      )}
                      {activity.utm_campaign && (
                        <div className="px-2 py-1 bg-gray-100 font-semibold text-gray-800 text-sm rounded-full flex items-center">
                          <Tag className="h-3 w-3 mr-1" />
                          {activity.utm_campaign}
                        </div>
                      )}
                    </div>
                    <div className="text-lg break-words font-normal">
                      {activity.source_url}
                    </div>
                    <AudioPlayer
                      audioUrl={activity.call_recording_url}
                      audioId={`combined-activity-${item.originalIndex}`}
                    />
                  </div>
                </div>

                {/* Student Comments Section */}
                {studentComments.length > 0 && (
                  <div className="space-y-2 mt-3">
                    {studentComments.map((comment, commentIndex) => (
                      <div
                        key={commentIndex}
                        className="px-3 py-2 bg-gray-100 text-gray-800 text-sm rounded-md"
                      >
                        <div className="font-semibold break-words">
                          {comment.question}
                        </div>
                        <div className="text-gray-600 break-words">
                          {comment.answer?.trim() ? comment.answer : "N/A"}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          } else if (item.type === "credential") {
            const credential = item.data;
            return (
              <div
                key={`credential-${item.originalIndex}`}
                className="border rounded-lg p-4 border-gray-200"
              >
                <div className="grid grid-cols-3 gap-4 items-start mb-3">
                  <div className="flex flex-col items-center w-52 flex-shrink-0 items-start">
                    <div className="text-sm text-black">
                      {item.date.toLocaleDateString()}
                    </div>
                    <div className="text-xs text-black">
                      {item.date.toLocaleTimeString()}
                    </div>
                    <div className="flex gap-2 mt-2">
                  <span className="text-sm">Assigned To:-</span>{" "}
                  {credential?.l3_counsellor_details?.counsellor_name && (
                    <span className="text-nowrap text-sm text-gray-600">
                      {credential.l3_counsellor_details.counsellor_name ||
                        "Supervisor"}
                    </span>
                  )}
                </div>
                  </div>

                  {/* Counsellor Name */}
                  <div className="flex items-center text-sm text-black w-24 flex-shrink-0">
                    <span className="text-nowrap">
                      {credential?.assignedCounsellor?.counsellor_name ||
                        "Supervisor"}
                    </span>
                  </div>

                  {/* Credentials Details */}
                  <div className="flex flex-col min-w-0">
                    {/* College Name Tag */}
                    {credential.enrolledCourse?.university_name && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        <div className="px-2 py-1 bg-blue-100 font-semibold text-blue-800 text-sm rounded-full flex items-center">
                          <Tag className="h-3 w-3 mr-1" />
                          {credential.enrolledCourse?.university_name}
                        </div>
                      </div>
                    )}

                    {/* Credentials Table */}
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <tbody>
                          <tr className="border-b border-gray-200">
                            <td className="px-3 py-2 font-medium text-gray-600 bg-gray-50 w-1/3">
                              Form ID:
                            </td>
                            <td className="px-3 py-2 text-gray-800 break-all">
                              {credential.form_id || "N/A"}
                            </td>
                          </tr>
                          <tr className="border-b border-gray-200">
                            <td className="px-3 py-2 font-medium text-gray-600 bg-gray-50 w-1/3">
                              Coupon Code:
                            </td>
                            <td className="px-3 py-2 text-gray-800 break-all">
                              {credential.coupon_code || "N/A"}
                            </td>
                          </tr>
                          <tr className="border-b border-gray-200">
                            <td className="px-3 py-2 font-medium text-gray-600 bg-gray-50 w-1/3">
                              Username:
                            </td>
                            <td className="px-3 py-2 text-gray-800 break-all">
                              {credential.user_name || "N/A"}
                            </td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 font-medium text-gray-600 bg-gray-50 w-1/3">
                              Password:
                            </td>
                            <td className="px-3 py-2 text-gray-800 break-all">
                              {credential.password || "N/A"}
                            </td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 font-medium text-gray-600 bg-gray-50 w-1/3">
                              Course Name:
                            </td>
                            <td className="px-3 py-2 text-gray-800 break-all">
                              {credential.enrolledCourse?.course_name || "N/A"}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            );
          }
        })}
      </div>
    );
  };

  const renderContent = () => {
    if (loading) {
      return <div className="text-gray-500 text-center py-4">Loading...</div>;
    }

    switch (activeTab) {
      case "remarks":
        return renderRemarks();
      case "activities":
        return renderActivities();
      case "credentials":
        return renderCredentials();
      case "payment":
        return renderPayments();
      case "all":
      default:
        return renderCombined();
    }
  };

  return (
    <div className="w-full p-4 bg-white rounded-lg">
      <h3 className="text-2xl font-medium mb-4 text-center">
        Student Activity
      </h3>

      {/* Tabs */}
      <div className="flex border-b mb-4">
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === "all"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500"
          }`}
          onClick={() => handleTabChange("all")}
        >
          All
        </button>
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === "remarks"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500"
          }`}
          onClick={() => handleTabChange("remarks")}
        >
          Remarks
        </button>
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === "activities"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500"
          }`}
          onClick={() => handleTabChange("activities")}
        >
          Activities
        </button>
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === "credentials"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500"
          }`}
          onClick={() => handleTabChange("credentials")}
        >
          Credentials
        </button>
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === "payment"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500"
          }`}
          onClick={() => handleTabChange("payment")}
        >
          Payment Status
        </button>
      </div>

      {/* Content */}
      {renderContent()}
    </div>
  );
};

export default ActivityRemarkstabs;
