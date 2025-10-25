"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Package,
  Camera,
  DollarSign,
  ShoppingCart,
  Plus,
  ArrowRight,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  Eye,
  Edit,
  QrCode,
  Upload,
} from "lucide-react";
import { IntakeStage } from "./workflow/intake-stage";
import { PricingStage } from "./workflow/pricing-stage";
import { PhotographyStage } from "./workflow/photography-stage";
import { ListingStage } from "./workflow/listing-stage";

interface Product {
  id: string;
  title: string;
  description?: string;
  category?: string;
  brand?: string;
  model?: string;
  price?: number;
  imageUrl?: string;
  status: "received" | "photographed" | "priced" | "listed" | "sold";
  sku?: string;
  createdAt: string;
  updatedAt: string;
  condition?: {
    grade: string;
    score: number;
    indicators: string[];
  };
  colors?: string[];
  size?: string;
  material?: string;
}

const statusConfig = {
  received: {
    label: "Received",
    color: "bg-blue-500",
    icon: Package,
    stage: "intake",
  },
  photographed: {
    label: "Photographed",
    color: "bg-purple-500",
    icon: Camera,
    stage: "pricing",
  },
  priced: {
    label: "Priced",
    color: "bg-yellow-500",
    icon: DollarSign,
    stage: "photography",
  },
  listed: {
    label: "Listed",
    color: "bg-green-500",
    icon: ShoppingCart,
    stage: "listing",
  },
  sold: {
    label: "Sold",
    color: "bg-emerald-600",
    icon: CheckCircle,
    stage: "complete",
  },
};

export function WorkflowDashboard() {
  const { data: session } = useSession();
  const [activeStage, setActiveStage] = useState("intake");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (session?.user) {
      fetchProducts();
    }
  }, [session]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/products");
      if (response.ok) {
        const data = await response.json();
        setProducts(
          Array.isArray(data?.products)
            ? data.products
            : Array.isArray(data)
            ? data
            : []
        );
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const getProductsByStatus = (status: string) => {
    return products.filter((product) => product.status === status);
  };

  const getStageProgress = (stage: string) => {
    // Map stage to corresponding status
    const getStatusForStage = (s: string): Product["status"] | null => {
      for (const [status, config] of Object.entries(statusConfig)) {
        if (config.stage === s) {
          return status as Product["status"];
        }
      }
      return null;
    };

    const targetStatus = getStatusForStage(stage);
    if (!targetStatus) return 0;

    const stageProducts = products.filter(
      (product) => product.status === targetStatus
    );
    return stageProducts.length;
  };

  const getTotalProgress = () => {
    const totalProducts = products.length;
    if (totalProducts === 0) return 0;

    const completedProducts = products.filter(
      (p) => p.status === "listed" || p.status === "sold"
    ).length;
    return (completedProducts / totalProducts) * 100;
  };

  const handleProductUpdate = async (
    productId: string,
    updates: Partial<Product>
  ) => {
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        await fetchProducts();
        if (selectedProduct?.id === productId) {
          setSelectedProduct({ ...selectedProduct, ...updates });
        }
      }
    } catch (error) {
      console.error("Error updating product:", error);
    }
  };

  const handleStageComplete = async (
    productId: string,
    nextStatus: Product["status"]
  ) => {
    await handleProductUpdate(productId, { status: nextStatus });
  };

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            Authentication Required
          </h3>
          <p className="text-muted-foreground">
            Please sign in to access the workflow dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Workflow Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Intake
                </p>
                <p className="text-2xl font-bold">
                  {getProductsByStatus("received").length}
                </p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Pricing
                </p>
                <p className="text-2xl font-bold">
                  {getProductsByStatus("photographed").length}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Photography
                </p>
                <p className="text-2xl font-bold">
                  {getProductsByStatus("priced").length}
                </p>
              </div>
              <Camera className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Listed
                </p>
                <p className="text-2xl font-bold">
                  {getProductsByStatus("listed").length}
                </p>
              </div>
              <ShoppingCart className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Workflow Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Overall Completion</span>
                <span>{Math.round(getTotalProgress())}%</span>
              </div>
              <Progress value={getTotalProgress()} className="h-2" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="font-semibold text-blue-600">
                  {getProductsByStatus("received").length}
                </div>
                <div className="text-muted-foreground">Awaiting Processing</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-purple-600">
                  {getProductsByStatus("photographed").length}
                </div>
                <div className="text-muted-foreground">Ready for Pricing</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-yellow-600">
                  {getProductsByStatus("priced").length}
                </div>
                <div className="text-muted-foreground">Ready for Photos</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-green-600">
                  {getProductsByStatus("listed").length}
                </div>
                <div className="text-muted-foreground">Active Listings</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Workflow Stages */}
      <Tabs
        value={activeStage}
        onValueChange={setActiveStage}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="intake" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Intake
          </TabsTrigger>
          <TabsTrigger value="pricing" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Pricing
          </TabsTrigger>
          <TabsTrigger value="photography" className="flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Photography
          </TabsTrigger>
          <TabsTrigger value="listing" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Listing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="intake" className="space-y-4">
          <IntakeStage
            products={getProductsByStatus("received")}
            onProductUpdate={handleProductUpdate}
            onStageComplete={handleStageComplete}
          />
        </TabsContent>

        <TabsContent value="pricing" className="space-y-4">
          <PricingStage
            products={getProductsByStatus("photographed")}
            onProductUpdate={handleProductUpdate}
            onStageComplete={handleStageComplete}
          />
        </TabsContent>

        <TabsContent value="photography" className="space-y-4">
          <PhotographyStage
            products={getProductsByStatus("priced")}
            onProductUpdate={handleProductUpdate}
            onStageComplete={handleStageComplete}
          />
        </TabsContent>

        <TabsContent value="listing" className="space-y-4">
          <ListingStage
            products={getProductsByStatus("listed")}
            onProductUpdate={handleProductUpdate}
            onStageComplete={handleStageComplete}
          />
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => setActiveStage("intake")}
              variant="outline"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Product
            </Button>
            <Button variant="outline" size="sm">
              <QrCode className="h-4 w-4 mr-2" />
              Print Labels
            </Button>
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Bulk Upload
            </Button>
            <Button variant="outline" size="sm">
              <TrendingUp className="h-4 w-4 mr-2" />
              Analytics
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
