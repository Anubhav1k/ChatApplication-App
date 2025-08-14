import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MessageCircle, Mail, Lock, User } from "lucide-react";
import { detectBrowserAndDevice } from "@/Functions";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

export default function Register() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [firstname, setfirstname] = useState("");
  const [lastname, setlastname] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  // Function to check password requirements
  const checkPasswordRequirements = (password: string) => {
    const requirements = [];
    
    if (password.length < 8) {
      requirements.push("At least 8 characters");
    }
    
    if (!/[A-Z]/.test(password)) {
      requirements.push("1 uppercase letter");
    }
    
    if (!/\d/.test(password)) {
      requirements.push("1 digit");
    }
    
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      requirements.push("1 special character");
    }
    
    return requirements;
  };

  const remainingRequirements = checkPasswordRequirements(password);

  // Effect to handle success message and hide tooltip
  useEffect(() => {
    if (remainingRequirements.length === 0 && password.length > 0) {
      setShowSuccessMessage(true);
      
      const timer = setTimeout(() => {
        setIsTooltipOpen(false);
        setShowSuccessMessage(false);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else {
      setShowSuccessMessage(false);
    }
  }, [remainingRequirements.length, password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const detectionResult = detectBrowserAndDevice();
    setError("");

    const passwordRegex =
      /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

    if (!password) {
      setError("Password is required");
      return;
    }

    if (!passwordRegex.test(password)) {
      setError(
        "Password must be at least 8 characters long, include one uppercase letter, one digit, and one special character"
      );
      return;
    }

    if (!confirmPassword) {
      setError("Confirm password is required");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords must match");
      return;
    }

    setIsLoading(true);

    try {
      await register({
        email,
        firstname,
        lastname,
        username,
        password,
        deviceInfo: {
          deviceId: detectionResult.deviceId,
          deviceName: detectionResult.device + " " + detectionResult.browser,
        },
      });
      navigate("/chat");
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-4">
            <MessageCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Join the conversation
          </h1>
          <p className="text-gray-600">Create your account to start chatting</p>
        </div>

        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-center">
              Create Account
            </CardTitle>
            <CardDescription className="text-center">
              Fill in your details to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="firstname" className="text-sm font-medium">
                  First Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="firstname"
                    type="text"
                    value={firstname}
                    onChange={(e) => setfirstname(e.target.value)}
                    placeholder="Enter your first name"
                    className="pl-10 h-12"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastname" className="text-sm font-medium">
                  Last Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="lastname"
                    type="text"
                    value={lastname}
                    onChange={(e) => setlastname(e.target.value)}
                    placeholder="Enter your last name"
                    className="pl-10 h-12"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="pl-10 h-12"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium">
                  Username
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Choose a username"
                    className="pl-10 h-12"
                    minLength={3}
                    maxLength={30}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <Tooltip open={isTooltipOpen}>
                  <TooltipTrigger asChild>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onFocus={() => setIsTooltipOpen(true)}
                        onBlur={() => setIsTooltipOpen(false)}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Create a password"
                        className="pl-10 h-12"
                        required
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="w-64 text-sm text-left">
                    {showSuccessMessage ? (
                      <span className="text-green-600 font-medium">
                        ✓ All requirements met!
                      </span>
                    ) : remainingRequirements.length > 0 ? (
                      <>
                        Password must contain:
                        <ul className="list-disc ml-4 mt-1 space-y-1">
                          {remainingRequirements.map((requirement, index) => (
                            <li key={index}>{requirement}</li>
                          ))}
                        </ul>
                      </>
                    ) : null}
                  </TooltipContent>
                </Tooltip>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="confirmPassword"
                  className="text-sm font-medium"
                >
                  Confirm Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className="pl-10 h-12"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                disabled={isLoading}
              >
                {isLoading ? "Creating account..." : "Create Account"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                >
                  Sign in here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}