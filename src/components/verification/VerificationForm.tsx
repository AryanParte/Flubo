
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

interface BusinessFormValues {
  companyName: string;
  companyWebsite: string;
  linkedinUrl: string;
  location: string;
  hasFunding: string;
  reason: string;
}

interface InvestorFormValues {
  fullName: string;
  linkedinUrl: string;
  investmentSize: string;
  interests: string;
  reason: string;
}

export const VerificationForm: React.FC<{ userType: "startup" | "investor" }> = ({ userType }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const businessForm = useForm<BusinessFormValues>({
    defaultValues: {
      companyName: "",
      companyWebsite: "",
      linkedinUrl: "",
      location: "",
      hasFunding: "no",
      reason: "",
    },
  });
  
  const investorForm = useForm<InvestorFormValues>({
    defaultValues: {
      fullName: "",
      linkedinUrl: "",
      investmentSize: "",
      interests: "",
      reason: "",
    },
  });
  
  // Load existing profile data
  React.useEffect(() => {
    if (user) {
      const loadProfile = async () => {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        
        if (!error && data) {
          if (userType === "startup") {
            businessForm.setValue("companyName", data.name || "");
          } else {
            investorForm.setValue("fullName", data.name || "");
          }
        }
      };
      
      loadProfile();
    }
  }, [user, userType]);
  
  const onSubmitBusiness = async (data: BusinessFormValues) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to verify your account.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setLoading(true);
      
      const { error } = await supabase.functions.invoke("verification-payment", {
        body: {
          verificationType: "startup",
          verificationResponses: data,
        },
      });
      
      if (error) {
        throw error;
      }
      
      const { data: paymentData } = await supabase.functions.invoke("verification-payment", {
        body: {
          verificationType: "startup",
          verificationResponses: data,
        },
      });
      
      if (paymentData?.url) {
        window.location.href = paymentData.url;
      } else {
        throw new Error("Payment URL not returned");
      }
    } catch (error) {
      console.error("Verification error:", error);
      toast({
        title: "Error",
        description: "Failed to process verification. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const onSubmitInvestor = async (data: InvestorFormValues) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to verify your account.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setLoading(true);
      
      const { data: paymentData, error } = await supabase.functions.invoke("verification-payment", {
        body: {
          verificationType: "investor",
          verificationResponses: data,
        },
      });
      
      if (error) {
        throw error;
      }
      
      if (paymentData?.url) {
        window.location.href = paymentData.url;
      } else {
        throw new Error("Payment URL not returned");
      }
    } catch (error) {
      console.error("Verification error:", error);
      toast({
        title: "Error",
        description: "Failed to process verification. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  if (userType === "startup") {
    return (
      <Form {...businessForm}>
        <form onSubmit={businessForm.handleSubmit(onSubmitBusiness)} className="space-y-6">
          <FormField
            control={businessForm.control}
            name="companyName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>What is your company's registered name?</FormLabel>
                <FormControl>
                  <Input placeholder="Company Name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={businessForm.control}
            name="companyWebsite"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Please share your company website</FormLabel>
                <FormControl>
                  <Input placeholder="https://yourcompany.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={businessForm.control}
            name="linkedinUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>LinkedIn or team profile (optional)</FormLabel>
                <FormControl>
                  <Input placeholder="https://linkedin.com/in/yourprofile" {...field} />
                </FormControl>
                <FormDescription>
                  Share your company's LinkedIn page or a team member's profile
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={businessForm.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Where is your company based?</FormLabel>
                <FormControl>
                  <Input placeholder="City, Country" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={businessForm.control}
            name="hasFunding"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Have you raised any funding yet?</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-col space-y-1"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="funding-yes" />
                      <Label htmlFor="funding-yes">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="funding-no" />
                      <Label htmlFor="funding-no">No</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="prefer-not-to-say" id="funding-prefer-not" />
                      <Label htmlFor="funding-prefer-not">Prefer not to say</Label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={businessForm.control}
            name="reason"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Why are you interested in verifying your account on Flubo?</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Tell us why you want to verify your account..."
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>Proceed to Payment ($10)</>
            )}
          </Button>
        </form>
      </Form>
    );
  }
  
  // Investor form
  return (
    <Form {...investorForm}>
      <form onSubmit={investorForm.handleSubmit(onSubmitInvestor)} className="space-y-6">
        <FormField
          control={investorForm.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Please enter your full name</FormLabel>
              <FormControl>
                <Input placeholder="Full Name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={investorForm.control}
          name="linkedinUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Please share a LinkedIn profile or investment profile</FormLabel>
              <FormControl>
                <Input placeholder="https://linkedin.com/in/yourprofile" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={investorForm.control}
          name="investmentSize"
          render={({ field }) => (
            <FormItem>
              <FormLabel>How much do you typically invest per startup?</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select investment range" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="10k-25k">$10k–$25k</SelectItem>
                  <SelectItem value="25k-100k">$25k–$100k</SelectItem>
                  <SelectItem value="100k-500k">$100k–$500k</SelectItem>
                  <SelectItem value="500k-1m">$500k–$1M</SelectItem>
                  <SelectItem value="1m-plus">$1M+</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={investorForm.control}
          name="interests"
          render={({ field }) => (
            <FormItem>
              <FormLabel>What sectors or regions are you most interested in?</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="SaaS, Healthcare, AI, Europe, Asia..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={investorForm.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Why are you interested in verifying your account on Flubo?</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tell us why you want to verify your account..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>Proceed to Payment ($20)</>
          )}
        </Button>
      </form>
    </Form>
  );
};
