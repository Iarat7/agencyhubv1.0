import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProductSchema, insertClientProductSchema } from "@shared/schema";
import { ProductsSkeleton } from "@/components/skeletons/products-skeleton";
import { ProductHeatMap } from "@/components/products/product-heat-map";
import { CostCalculator } from "@/components/products/cost-calculator";
import { ProductRecommendations } from "@/components/products/product-recommendations";
import { EnhancedProductCard } from "@/components/products/enhanced-product-card";
import { Plus, Search, Package, TrendingUp, DollarSign, Users, Edit, Trash2, Eye, Calculator } from "lucide-react";

import type { Product, Client, ClientProduct } from "@shared/schema";

const productCategories = [
  "SEO",
  "Social Media",
  "PPC",
  "Web Design",
  "Content Marketing",
  "Email Marketing",
  "Analytics",
  "Branding",
  "E-commerce",
  "Consultoria"
];

export default function Products() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
  const [isClientProductModalOpen, setIsClientProductModalOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: products = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ["/api/products"],
    enabled: isAuthenticated,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["/api/clients"],
    enabled: isAuthenticated,
  });

  const { data: analytics } = useQuery({
    queryKey: ["/api/product-analytics"],
    enabled: isAuthenticated,
  });

  const createProductMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/products", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/product-analytics"] });
      setIsCreateModalOpen(false);
      form.reset();
      toast({
        title: "Sucesso",
        description: "Produto criado com sucesso!",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Erro",
        description: "Falha ao criar produto.",
        variant: "destructive",
      });
    },
  });

  const editProductMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest(`/api/products/${id}`, "PUT", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/product-analytics"] });
      setIsEditModalOpen(false);
      editForm.reset();
      toast({
        title: "Sucesso",
        description: "Produto atualizado com sucesso!",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Erro",
        description: "Falha ao atualizar produto.",
        variant: "destructive",
      });
    },
  });

  const assignProductMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/client-products", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/client-products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/product-analytics"] });
      setIsClientProductModalOpen(false);
      clientProductForm.reset();
      toast({
        title: "Sucesso",
        description: "Produto atribuído ao cliente com sucesso!",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Erro",
        description: "Falha ao atribuir produto ao cliente.",
        variant: "destructive",
      });
    },
  });

  const form = useForm({
    resolver: zodResolver(insertProductSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
      basePrice: "",
      costEstimate: "",
      profitMargin: "",
      isActive: true,
    },
  });

  const editForm = useForm({
    resolver: zodResolver(insertProductSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
      basePrice: "",
      costEstimate: "",
      profitMargin: "",
      isActive: true,
    },
  });

  const clientProductForm = useForm({
    resolver: zodResolver(insertClientProductSchema),
    defaultValues: {
      clientId: "",
      productId: "",
      customPrice: "",
      customCost: "",
      isActive: true,
      startDate: "",
      notes: "",
    },
  });

  const onSubmit = (data: any) => {
    createProductMutation.mutate({
      ...data,
      basePrice: data.basePrice ? parseFloat(data.basePrice) : null,
      costEstimate: data.costEstimate ? parseFloat(data.costEstimate) : null,
      profitMargin: data.profitMargin ? parseFloat(data.profitMargin) : null,
    });
  };

  const onEditSubmit = (data: any) => {
    if (!selectedProduct) return;
    
    editProductMutation.mutate({
      id: selectedProduct.id,
      data: {
        ...data,
        basePrice: data.basePrice ? parseFloat(data.basePrice) : null,
        costEstimate: data.costEstimate ? parseFloat(data.costEstimate) : null,
        profitMargin: data.profitMargin ? parseFloat(data.profitMargin) : null,
      },
    });
  };

  const onClientProductSubmit = (data: any) => {
    assignProductMutation.mutate({
      ...data,
      clientId: parseInt(data.clientId),
      productId: parseInt(data.productId),
      customPrice: data.customPrice ? parseFloat(data.customPrice) : null,
      customCost: data.customCost ? parseFloat(data.customCost) : null,
    });
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    editForm.reset({
      name: product.name,
      description: product.description || "",
      category: product.category,
      basePrice: product.basePrice?.toString() || "",
      costEstimate: product.costEstimate?.toString() || "",
      profitMargin: product.profitMargin?.toString() || "",
      isActive: product.isActive ?? true,
    });
    setIsEditModalOpen(true);
  };

  const handleAssignToClient = (product: Product) => {
    setSelectedProduct(product);
    clientProductForm.reset({
      clientId: "",
      productId: product.id.toString(),
      customPrice: "",
      customCost: "",
      isActive: true,
      startDate: "",
      notes: "",
    });
    setIsClientProductModalOpen(true);
  };

  if (isLoading || isLoadingProducts) {
    return <ProductsSkeleton />;
  }

  const filteredProducts = (products as Product[])?.filter((product: Product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="content-area sidebar-expanded">
      <div className="content-wrapper">
        <div className="min-h-screen bg-slate-50">
          <main className="p-4 lg:p-8 max-w-full">
        <div className="space-y-6 lg:space-y-8">
          {/* Header com botão de criar */}
          <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
            <div>
              <h1 className="text-xl lg:text-3xl font-bold tracking-tight">Produtos & Serviços</h1>
              <p className="text-sm lg:text-base text-muted-foreground">
                Gerencie seu catálogo de produtos e serviços, analise vendas e previsões de custos
              </p>
            </div>
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Produto
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Criar Novo Produto/Serviço</DialogTitle>
                  <DialogDescription>
                    Adicione um novo produto ou serviço ao seu catálogo
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome</FormLabel>
                            <FormControl>
                              <Input placeholder="Nome do produto/serviço" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Categoria</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione uma categoria" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {productCategories.map((category) => (
                                  <SelectItem key={category} value={category}>
                                    {category}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrição</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Descreva o produto ou serviço..."
                              className="resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="basePrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Preço Base (R$)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.01" 
                                placeholder="0,00" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="costEstimate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Custo Estimado (R$)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.01" 
                                placeholder="0,00" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="profitMargin"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Margem de Lucro (%)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.01" 
                                placeholder="0,00" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsCreateModalOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={createProductMutation.isPending}>
                        {createProductMutation.isPending ? "Criando..." : "Criar Produto"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Produto Mais Vendido</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics?.topSellingProducts?.[0]?.totalSales || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {analytics?.topSellingProducts?.[0]?.product?.name || "Nenhum"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  R$ {analytics?.topSellingProducts?.reduce((acc: number, item: any) => acc + (item.totalRevenue || 0), 0).toLocaleString('pt-BR') || "0,00"}
                </div>
                <p className="text-xs text-muted-foreground">
                  De produtos vendidos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(products as Product[])?.filter((p: Product) => p.isActive).length || 0} ativos
                </div>
                <p className="text-xs text-muted-foreground">
                  Com produtos atribuídos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Categorias</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {productCategories.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Todas as categorias
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filtros */}
          <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
            <div className="flex flex-col sm:flex-row gap-3 lg:gap-4 flex-1">
              <div className="relative flex-1 lg:max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar produtos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-48 h-10">
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {productCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              onClick={() => setIsAnalyticsModalOpen(true)}
              className="w-full sm:w-auto"
            >
              <Calculator className="mr-2 h-4 w-4" />
              Ver Analytics
            </Button>
          </div>

          {/* Lista de Produtos */}
          {filteredProducts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Package className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum produto encontrado</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Você ainda não criou nenhum produto ou serviço.
                </p>
                <Button onClick={() => setIsCreateModalOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Primeiro Produto
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
              {filteredProducts.map((product: Product) => (
                <Card key={product.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{product.name}</CardTitle>
                        <CardDescription className="mt-1">
                          <Badge variant="outline">{product.category}</Badge>
                        </CardDescription>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditProduct(product)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAssignToClient(product)}
                        >
                          <Users className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {product.description && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {product.description}
                      </p>
                    )}
                    <div className="space-y-2">
                      {product.basePrice && (
                        <div className="flex justify-between text-sm">
                          <span>Preço Base:</span>
                          <span className="font-medium">R$ {Number(product.basePrice).toLocaleString('pt-BR')}</span>
                        </div>
                      )}
                      {product.costEstimate && (
                        <div className="flex justify-between text-sm">
                          <span>Custo Est.:</span>
                          <span>R$ {Number(product.costEstimate).toLocaleString('pt-BR')}</span>
                        </div>
                      )}
                      {product.profitMargin && (
                        <div className="flex justify-between text-sm">
                          <span>Margem:</span>
                          <span className="text-green-600">{Number(product.profitMargin).toFixed(1)}%</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <Badge variant={product.isActive ? "default" : "secondary"}>
                        {product.isActive ? "Ativo" : "Inativo"}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAssignToClient(product)}
                      >
                        Atribuir a Cliente
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
          </main>
        </div>
      </div>
    </div>
  );
}