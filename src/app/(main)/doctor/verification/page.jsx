"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

const VerificationPage = () => {
  const router = useRouter();
  const [checking, setChecking] = useState(false);

  const handleCheckStatus = () => {
    setChecking(true);
    // Refresh the page to re-check verification status via the doctor layout/page
    router.refresh();
    setTimeout(() => {
      router.push("/doctor");
      setChecking(false);
    }, 1500);
  };

  return (
    <div className="max-w-xl mx-auto">
      <Card className="border-yellow-600/30 bg-yellow-950/10">
        <CardContent className="pt-8 pb-8 flex flex-col items-center text-center space-y-6">
          <div className="p-5 bg-yellow-900/20 rounded-full">
            <Clock className="h-12 w-12 text-yellow-400 animate-pulse" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">
              Verification Pending
            </h2>
            <p className="text-muted-foreground text-base max-w-md">
              Your doctor profile is currently under review. Our admin team will
              verify your credentials shortly. You&apos;ll get full access to the
              dashboard once approved.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full pt-2">
            <div className="flex flex-col items-center p-4 rounded-lg bg-emerald-950/20 border border-emerald-900/20">
              <CheckCircle className="h-5 w-5 text-emerald-400 mb-2" />
              <span className="text-sm text-muted-foreground">Profile Submitted</span>
            </div>
            <div className="flex flex-col items-center p-4 rounded-lg bg-yellow-950/20 border border-yellow-600/20">
              <Clock className="h-5 w-5 text-yellow-400 mb-2" />
              <span className="text-sm text-muted-foreground">Under Review</span>
            </div>
            <div className="flex flex-col items-center p-4 rounded-lg bg-muted/10 border border-muted/20">
              <XCircle className="h-5 w-5 text-muted-foreground/40 mb-2" />
              <span className="text-sm text-muted-foreground/40">Dashboard Access</span>
            </div>
          </div>

          <Button
            onClick={handleCheckStatus}
            variant="outline"
            className="border-yellow-600/30 hover:bg-yellow-950/20 mt-2"
            disabled={checking}
          >
            {checking ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Check Verification Status
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerificationPage;
