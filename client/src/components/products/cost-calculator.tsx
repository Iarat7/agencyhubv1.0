import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Calculator, TrendingUp, Users, DollarSign, Percent, Clock } from "lucide-react";

interface CostCalculation {
  basePrice: number;
  quantity: number;
  duration: number;
  discount: number;
  subtotal: number;
  discountAmount: number;
  total: number;
  monthlyRecurring: number;
  profitMargin: number;
}

export function CostCalculator() {
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [calculation, setCalculation] = useState<CostCalculation | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const { data: clients = [] } = useQuery<any[]>({
    queryKey: ["/api/clients"],
  });

  const { data: products = [] } = useQuery<any[]>({
    queryKey: ["/api/products"],
  });

  const { data: clientProducts = [] } = useQuery({
    queryKey: ["/api/client-products"],
    enabled: !!selectedClient,
  });

  const addProduct = () => {
    setSelectedProducts([...selectedProducts, {
      id: '',
      quantity: 1,
      duration: 12,
      customPrice: 0,
      discount: 0
    }]);
  };

  const updateProduct = (index: number, field: string, value: any) => {
    const updated = [...selectedProducts];
    updated[index] = { ...updated[index], [field]: value };
    setSelectedProducts(updated);
  };

  const removeProduct = (index: number) => {
    setSelectedProducts(selectedProducts.filter((_, i) => i !== index));
  };

  const calculateCost = () => {
    let subtotal = 0;
    let totalDiscount = 0;
    let monthlyRecurring = 0;

    selectedProducts.forEach(item => {
      const product = (products as any[]).find((p: any) => p.id.toString() === item.id);
      if (!product) return;

      const basePrice = item.customPrice || product.basePrice || 0;
      const itemSubtotal = basePrice * item.quantity * item.duration;
      const itemDiscount = (itemSubtotal * item.discount) / 100;
      
      subtotal += itemSubtotal;
      totalDiscount += itemDiscount;
      
      // Calculate monthly recurring (assuming annual contracts)
      monthlyRecurring += (basePrice * item.quantity);
    });

    const total = subtotal - totalDiscount;
    const profitMargin = ((total - (subtotal * 0.3)) / total) * 100; // Assuming 30% cost

    setCalculation({
      basePrice: subtotal,
      quantity: selectedProducts.reduce((sum, p) => sum + p.quantity, 0),
      duration: Math.max(...selectedProducts.map(p => p.duration), 0),
      discount: (totalDiscount / subtotal) * 100,
      subtotal,
      discountAmount: totalDiscount,
      total,
      monthlyRecurring,
      profitMargin: isNaN(profitMargin) ? 0 : profitMargin
    });

    setIsVisible(true);
  };

  const getProductName = (productId: string) => {
    const product = (products as any[]).find((p: any) => p.id.toString() === productId);
    return product?.name || 'Produto não encontrado';
  };

  return (
    <Card className="relative overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Calculadora de Custos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Client Selection */}
        <div className="space-y-2">
          <Label>Cliente (Opcional)</Label>
          <Select value={selectedClient} onValueChange={setSelectedClient}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um cliente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">Novo cliente / Proposta</SelectItem>
              {(clients as any[]).map((client: any) => (
                <SelectItem key={client.id} value={client.id.toString()}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Products Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">Produtos/Serviços</Label>
            <Button onClick={addProduct} variant="outline" size="sm">
              <Users className="h-4 w-4 mr-2" />
              Adicionar Produto
            </Button>
          </div>

          {selectedProducts.map((item, index) => (
            <Card key={index} className="p-4 bg-slate-50">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <Label className="text-sm">Produto</Label>
                  <Select 
                    value={item.id} 
                    onValueChange={(value) => updateProduct(index, 'id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {(products as any[]).map((product: any) => (
                        <SelectItem key={product.id} value={product.id.toString()}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm">Quantidade</Label>
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateProduct(index, 'quantity', parseInt(e.target.value) || 1)}
                  />
                </div>

                <div>
                  <Label className="text-sm">Duração (meses)</Label>
                  <Input
                    type="number"
                    min="1"
                    value={item.duration}
                    onChange={(e) => updateProduct(index, 'duration', parseInt(e.target.value) || 1)}
                  />
                </div>

                <div>
                  <Label className="text-sm">Preço Customizado</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Padrão do produto"
                    value={item.customPrice || ''}
                    onChange={(e) => updateProduct(index, 'customPrice', parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Label className="text-sm">Desconto (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={item.discount}
                      onChange={(e) => updateProduct(index, 'discount', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => removeProduct(index)}
                  >
                    ×
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          {selectedProducts.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              <Calculator className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Adicione produtos para calcular o custo</p>
            </div>
          )}
        </div>

        {selectedProducts.length > 0 && (
          <Button onClick={calculateCost} className="w-full" size="lg">
            <Calculator className="h-4 w-4 mr-2" />
            Calcular Custo Total
          </Button>
        )}

        {/* Results */}
        {calculation && isVisible && (
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-blue-900">Resultado do Cálculo</h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <DollarSign className="h-5 w-5 text-green-600" />
                    </div>
                    <p className="text-sm text-slate-600">Subtotal</p>
                    <p className="text-lg font-bold">R$ {calculation.subtotal.toLocaleString('pt-BR')}</p>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Percent className="h-5 w-5 text-orange-600" />
                    </div>
                    <p className="text-sm text-slate-600">Desconto</p>
                    <p className="text-lg font-bold">R$ {calculation.discountAmount.toLocaleString('pt-BR')}</p>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                    </div>
                    <p className="text-sm text-slate-600">Total</p>
                    <p className="text-xl font-bold text-blue-900">R$ {calculation.total.toLocaleString('pt-BR')}</p>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Clock className="h-5 w-5 text-purple-600" />
                    </div>
                    <p className="text-sm text-slate-600">Mensal Recorrente</p>
                    <p className="text-lg font-bold">R$ {calculation.monthlyRecurring.toLocaleString('pt-BR')}</p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Badge variant="secondary">
                      {calculation.quantity} produtos
                    </Badge>
                    <Badge variant="secondary">
                      {calculation.duration} meses
                    </Badge>
                    {calculation.profitMargin > 0 && (
                      <Badge variant={calculation.profitMargin > 50 ? "default" : "destructive"}>
                        {calculation.profitMargin.toFixed(1)}% margem
                      </Badge>
                    )}
                  </div>
                  
                  <Button variant="outline" onClick={() => setIsVisible(false)}>
                    Fechar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}