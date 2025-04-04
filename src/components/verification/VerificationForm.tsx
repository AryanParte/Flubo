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
import { Loader2, Upload } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Checkbox } from "@/components/ui/checkbox";

interface BusinessFormValues {
  companyEmail: string;
  companyWebsite: string;
  ownsWebsite: string;
  linkedinUrl: string;
  otherProfileUrl: string;
  hasProduct: string;
  milestone: string;
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
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  
  const businessForm = useForm<BusinessFormValues>({
    defaultValues: {
      companyEmail: "",
      companyWebsite: "",
      ownsWebsite: "yes",
      linkedinUrl: "",
      otherProfileUrl: "",
      hasProduct: "yes",
      milestone: "",
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
            businessForm.setValue("companyEmail", data.email || "");
          } else {
            investorForm.setValue("fullName", data.name || "");
          }
        }
      };
      
      loadProfile();
    }
  }, [user, userType]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setDocumentFile(files[0]);
    }
  };
  
  const uploadDocument = async (userId: string): Promise<string | null> => {
    if (!documentFile) return null;
    
    try {
      const fileExt = documentFile.name.split('.').pop();
      const filePath = `${userId}/${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('verification-documents')
        .upload(filePath, documentFile);
      
      if (uploadError) {
        console.error("Error uploading document:", uploadError);
        return null;
      }
      
      return filePath;
    } catch (error) {
      console.error("Error in document upload process:", error);
      return null;
    }
  };
  
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
      
      let documentUrl = null;
      if (documentFile) {
        documentUrl = await uploadDocument(user.id);
      }
      
      const verificationData = {
        ...data,
        documentUrl
      };
      
      const { data: paymentData, error } = await supabase.functions.invoke("verification-payment", {
        body: {
          verificationType: "startup",
          verificationResponses: verificationData,
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
            name="companyEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Official Company Email (not Gmail/Yahoo)</FormLabel>
                <FormControl>
                  <Input placeholder="yourname@company.com" {...field} />
                </FormControl>
                <FormDescription>
                  We'll use this to confirm you control your company domain.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={businessForm.control}
            name="companyWebsite"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company Website</FormLabel>
                <FormControl>
                  <Input placeholder="https://yourcompany.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={businessForm.control}
            name="ownsWebsite"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Do you own or control the domain you submitted as your company website?</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-col space-y-1"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="owns-website-yes" />
                      <Label htmlFor="owns-website-yes">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="owns-website-no" />
                      <Label htmlFor="owns-website-no">No</Label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="space-y-3">
            <FormLabel>Can you link your company or team profile on a trusted platform? (at least one required)</FormLabel>
            
            <FormField
              control={businessForm.control}
              name="linkedinUrl"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center">
                    <span className="min-w-24 text-sm font-medium">LinkedIn:</span>
                    <FormControl>
                      <Input placeholder="https://linkedin.com/in/yourprofile" {...field} />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={businessForm.control}
              name="otherProfileUrl"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center">
                    <span className="min-w-24 text-sm font-medium">Other:</span>
                    <FormControl>
                      <Input placeholder="Crunchbase / AngelList / Product Hunt URL" {...field} />
                    </FormControl>
                  </div>
                  <FormDescription className="ml-24">
                    Crunchbase / AngelList / Product Hunt / Other
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="space-y-3">
            <FormLabel>Optional: Upload proof of incorporation or business registration document.</FormLabel>
            <div className="flex items-center gap-3">
              <div className="border border-border rounded-md p-3 w-full">
                <input
                  type="file"
                  id="document-upload"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="document-upload"
                  className="flex items-center gap-2 cursor-pointer text-sm"
                >
                  <Upload className="h-4 w-4" />
                  {documentFile ? documentFile.name : "Choose a file"}
                </label>
              </div>
              {documentFile && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setDocumentFile(null)}
                >
                  Clear
                </Button>
              )}
            </div>
            <FormDescription>
              A certificate, government filing, or tax doc works (PDF or image).
            </FormDescription>
          </div>
          
          <FormField
            control={businessForm.control}
            name="hasProduct"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Do you currently have a working product, demo, or public waitlist?</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-col space-y-1"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="has-product-yes" />
                      <Label htmlFor="has-product-yes">Yes, it's live or in beta (we'll review it on your profile)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="has-product-no" />
                      <Label htmlFor="has-product-no">Not yet, still in early stages</Label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={businessForm.control}
            name="milestone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Briefly describe one real milestone or traction point you've achieved</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Tell us about customers, launch, signups, etc."
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Even a waitlist or MVP launch counts. Real startups can explain.
                </FormDescription>
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
