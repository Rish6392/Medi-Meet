"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock, Plus, Loader2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { setAvailabilitySlots } from "@/actions/doctor";
import useFetch from "@/hooks/use-fetch";
import { toast } from "sonner";

export function AvailabilitySettings({ slots }) {
  const [showForm, setShowForm] = useState(false);

  // Custom hook for server action
  const { loading, fn: submitSlots, data } = useFetch(setAvailabilitySlots);

  // React Hook Form
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      startHour: "09",
      startMinute: "00",
      startPeriod: "AM",
      endHour: "05",
      endMinute: "00",
      endPeriod: "PM",
    },
  });

  const hourOptions = [
    "01",
    "02",
    "03",
    "04",
    "05",
    "06",
    "07",
    "08",
    "09",
    "10",
    "11",
    "12",
  ];

  const minuteOptions = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];

  const periodOptions = ["AM", "PM"];

  function to24HourTime(hour12, minute, period) {
    const parsedHour = Number(hour12);
    let hour24 = parsedHour % 12;

    if (period === "PM") {
      hour24 += 12;
    }

    return `${hour24.toString().padStart(2, "0")}:${minute}`;
  }

  function createLocalDateFromTime(timeStr) {
    const [hours, minutes] = timeStr.split(":").map(Number);
    const now = new Date();
    const date = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      hours,
      minutes
    );
    return date;
  }

  // Handle slot submission
  const onSubmit = async (formValues) => {
    if (loading) return;

    const formData = new FormData();

    const startTime24 = to24HourTime(
      formValues.startHour,
      formValues.startMinute,
      formValues.startPeriod
    );

    const endTime24 = to24HourTime(
      formValues.endHour,
      formValues.endMinute,
      formValues.endPeriod
    );

    // Create date objects
    const startDate = createLocalDateFromTime(startTime24);
    const endDate = createLocalDateFromTime(endTime24);

    if (startDate >= endDate) {
      toast.error("End time must be after start time");
      return;
    }

    // Add to form data
    formData.append("startTime", startDate.toISOString());
    formData.append("endTime", endDate.toISOString());

    await submitSlots(formData);
  };

  useEffect(() => {
    if (data && data?.success) {
      setShowForm(false);
      toast.success("Availability slots updated successfully");
    }
  }, [data]);

  // Format time string for display
  const formatTimeString = (dateString) => {
    try {
      return format(new Date(dateString), "h:mm a");
    } catch (_error) {
      return "Invalid time";
    }
  };

  return (
    <Card className="border-emerald-900/20">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-white flex items-center">
          <Clock className="h-5 w-5 mr-2 text-emerald-400" />
          Availability Settings
        </CardTitle>
        <CardDescription>
          Set your daily availability for patient appointments
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Current Availability Display */}
        {!showForm ? (
          <>
            <div className="mb-6">
              <h3 className="text-lg font-medium text-white mb-3">
                Current Availability
              </h3>

              {slots.length === 0 ? (
                <p className="text-muted-foreground">
                  You haven&apos;t set any availability slots yet. Add your
                  availability to start accepting appointments.
                </p>
              ) : (
                <div className="space-y-3">
                  {slots.map((slot) => (
                    <div
                      key={slot.id}
                      className="flex items-center p-3 rounded-md bg-muted/20 border border-emerald-900/20"
                    >
                      <div className="bg-emerald-900/20 p-2 rounded-full mr-3">
                        <Clock className="h-4 w-4 text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">
                          {formatTimeString(slot.startTime)} -{" "}
                          {formatTimeString(slot.endTime)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {slot.appointment ? "Booked" : "Available"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button
              onClick={() => setShowForm(true)}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Set Availability Time
            </Button>
          </>
        ) : (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4 border border-emerald-900/20 rounded-md p-4"
          >
            <h3 className="text-lg font-medium text-white mb-2">
              Set Daily Availability
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <div className="grid grid-cols-3 gap-2">
                  <select
                    {...register("startHour", {
                      required: "Start hour is required",
                    })}
                    className="flex h-9 w-full rounded-md border border-emerald-900/20 bg-background px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    {hourOptions.map((hour) => (
                      <option key={`start-hour-${hour}`} value={hour}>
                        {hour}
                      </option>
                    ))}
                  </select>
                  <select
                    {...register("startMinute", {
                      required: "Start minute is required",
                    })}
                    className="flex h-9 w-full rounded-md border border-emerald-900/20 bg-background px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    {minuteOptions.map((minute) => (
                      <option key={`start-minute-${minute}`} value={minute}>
                        {minute}
                      </option>
                    ))}
                  </select>
                  <select
                    {...register("startPeriod", {
                      required: "Start period is required",
                    })}
                    className="flex h-9 w-full rounded-md border border-emerald-900/20 bg-background px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    {periodOptions.map((period) => (
                      <option key={`start-period-${period}`} value={period}>
                        {period}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.startHour && (
                  <p className="text-sm font-medium text-red-500">
                    {errors.startHour.message}
                  </p>
                )}
                {errors.startMinute && (
                  <p className="text-sm font-medium text-red-500">
                    {errors.startMinute.message}
                  </p>
                )}
                {errors.startPeriod && (
                  <p className="text-sm font-medium text-red-500">
                    {errors.startPeriod.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <div className="grid grid-cols-3 gap-2">
                  <select
                    {...register("endHour", {
                      required: "End hour is required",
                    })}
                    className="flex h-9 w-full rounded-md border border-emerald-900/20 bg-background px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    {hourOptions.map((hour) => (
                      <option key={`end-hour-${hour}`} value={hour}>
                        {hour}
                      </option>
                    ))}
                  </select>
                  <select
                    {...register("endMinute", {
                      required: "End minute is required",
                    })}
                    className="flex h-9 w-full rounded-md border border-emerald-900/20 bg-background px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    {minuteOptions.map((minute) => (
                      <option key={`end-minute-${minute}`} value={minute}>
                        {minute}
                      </option>
                    ))}
                  </select>
                  <select
                    {...register("endPeriod", {
                      required: "End period is required",
                    })}
                    className="flex h-9 w-full rounded-md border border-emerald-900/20 bg-background px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    {periodOptions.map((period) => (
                      <option key={`end-period-${period}`} value={period}>
                        {period}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.endHour && (
                  <p className="text-sm font-medium text-red-500">
                    {errors.endHour.message}
                  </p>
                )}
                {errors.endMinute && (
                  <p className="text-sm font-medium text-red-500">
                    {errors.endMinute.message}
                  </p>
                )}
                {errors.endPeriod && (
                  <p className="text-sm font-medium text-red-500">
                    {errors.endPeriod.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
                disabled={loading}
                className="border-emerald-900/30"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Availability"
                )}
              </Button>
            </div>
          </form>
        )}

        <div className="mt-6 p-4 bg-muted/10 border border-emerald-900/10 rounded-md">
          <h4 className="font-medium text-white mb-2 flex items-center">
            <AlertCircle className="h-4 w-4 mr-2 text-emerald-400" />
            How Availability Works
          </h4>
          <p className="text-muted-foreground text-sm">
            Setting your daily availability allows patients to book appointments
            during those hours. The same availability applies to all days. You
            can update your availability at any time, but existing booked
            appointments will not be affected.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}