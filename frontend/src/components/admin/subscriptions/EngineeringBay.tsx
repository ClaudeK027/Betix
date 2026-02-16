"use client";

import { Plan, FeatureDefinition, PlanFeatures, PlanFeature } from "@/types/plans";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Save, Archive, DollarSign, Package, Star, X, Check, Plus, Loader2, Percent, Info, Rocket } from "lucide-react";
import { useState, useEffect } from "react";
import { updatePlanAction, createPlanAction, UpdatePlanData } from "@/app/(admin)/admin/subscriptions/actions";
import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatFeatureValue } from "@/lib/plans";
import { toast } from "sonner"; // Assuming sonner is installed

interface EngineeringBayProps {
    plan: Plan | null;
    definitions: FeatureDefinition[];
    open: boolean;
    onClose: () => void;
    onSuccess?: () => void | Promise<void>;
}

export function EngineeringBay({ plan, definitions, open, onClose, onSuccess }: EngineeringBayProps) {
    const [formData, setFormData] = useState<UpdatePlanData>({});
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<keyof PlanFeatures>("core");
    const router = useRouter();

    const isCreating = !plan;

    // FIX: Listen to 'plan' prop deep changes to ensure we always show fresh data
    useEffect(() => {
        if (open) {
            if (plan) {
                console.log("[EngineeringBay] Resetting form with fresh plan data:", plan.name, plan.price);
                setFormData({
                    name: plan.name,
                    description: plan.description || "",
                    price: plan.price,
                    frequency: plan.frequency,
                    features: JSON.parse(JSON.stringify(plan.features)), // Deep copy
                    is_active: plan.is_active,
                    position: plan.position,
                    promo: plan.promo ? { ...plan.promo } : null
                });
            } else {
                // Reset for creation
                console.log("[EngineeringBay] Resetting form for creation mode");
                setFormData({
                    name: "",
                    description: "",
                    price: 0,
                    frequency: 'monthly', // Default
                    features: { core: {}, advanced: {}, vip: {} },
                    is_active: false,
                    position: 0,
                    promo: null
                });
            }
        }
    }, [plan, open]);

    const handleSave = async () => {
        setIsLoading(true);
        try {
            let result;
            if (isCreating) {
                result = await createPlanAction(formData);
            } else {
                result = await updatePlanAction(plan!.id, formData);
            }

            if (result.success) {
                if (onSuccess) onSuccess();
                onClose();
                // Toast success could go here
            } else {
                console.error("Operation failed:", result.error);
                // Toast error could go here
            }
        } catch (error) {
            console.error("Operation error:", error);
        }
        setIsLoading(false);
    };

    const updateFeature = (category: keyof PlanFeatures, key: string, value: any) => {
        const newFeatures = { ...(formData.features || { core: {}, advanced: {}, vip: {} }) } as PlanFeatures;
        if (!newFeatures[category]) newFeatures[category] = {};

        newFeatures[category][key] = value;
        setFormData({ ...formData, features: newFeatures });
    };

    const removeFeature = (category: keyof PlanFeatures, key: string) => {
        const newFeatures = { ...(formData.features || { core: {}, advanced: {}, vip: {} }) } as PlanFeatures;
        if (newFeatures[category]) {
            const { [key]: _, ...rest } = newFeatures[category];
            newFeatures[category] = rest;
            setFormData({ ...formData, features: newFeatures });
        }
    };

    const addFeature = (category: keyof PlanFeatures, defId: string) => {
        const def = definitions.find(d => d.id === defId);
        if (!def) return;

        let initialValue: any = def.type === 'boolean' ? true : "Valeur here";
        updateFeature(category, defId, initialValue);
    };

    const isFormValid = formData.name && formData.price !== undefined && formData.frequency;

    return (
        <Sheet open={open} onOpenChange={onClose}>
            <SheetContent className="w-full sm:max-w-xl border-l border-white/10 bg-black/95 backdrop-blur-xl p-0 shadow-2xl flex flex-col">
                <SheetHeader className="sr-only">
                    <SheetTitle>{isCreating ? "Engineering Bay: NEW_SCHEMATIC" : `Engineering Bay: ${plan?.name}`}</SheetTitle>
                    <SheetDescription>Configuration du plan</SheetDescription>
                </SheetHeader>

                {/* Header */}
                <div className="h-24 bg-neutral-900 relative overflow-hidden border-b border-white/10 flex-shrink-0">
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,#000_25%,transparent_25%,transparent_50%,#000_50%,#000_75%,transparent_75%,transparent)] bg-[length:20px_20px] opacity-20" />
                    <div className="absolute inset-0 flex items-center justify-between px-6">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-lg bg-neutral-800 flex items-center justify-center border border-white/10">
                                {isCreating ? <Rocket className="size-5 text-amber-500" /> : <Settings className="size-5 text-neutral-400 animate-spin-slow" />}
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-white uppercase tracking-widest">
                                    {isCreating ? "NEW SCHEMATIC" : "Engineering Bay"}
                                </h2>
                                <p className="text-[10px] font-mono text-neutral-500">
                                    {isCreating ? "INIT_SEQUENCE_STARTED" : "PLAN_CONFIG_MODULE_V3"}
                                </p>
                            </div>
                        </div>
                        <Badge variant="outline" className="border-amber-500/50 text-amber-500 bg-amber-500/10 font-bold">
                            {isCreating ? "CREATION MODE" : "EDIT MODE"}
                        </Badge>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">

                    {/* General Settings */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-neutral-500 uppercase flex items-center gap-2">
                            <Package className="size-3.5" /> Core Status
                        </h3>
                        <div className="grid gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-mono text-neutral-400">PLAN_NAME <span className="text-red-500">*</span></Label>
                                <Input
                                    value={formData.name || ''}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="bg-white/5 border-white/10 text-white font-bold"
                                    placeholder="ex: The Architect"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-mono text-neutral-400">MARKETING_TAGLINE</Label>
                                <Input
                                    value={formData.description || ''}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="bg-white/5 border-white/10 text-white text-xs"
                                    placeholder="ex: Pour les experts de la data."
                                />
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                                <div className="space-y-0.5">
                                    <Label className="text-xs font-mono text-neutral-400">SYSTEM_ACTIVE</Label>
                                    <p className="text-[10px] text-neutral-500">Enable public visibility</p>
                                </div>
                                <Switch
                                    checked={formData.is_active || false}
                                    onCheckedChange={(c) => setFormData({ ...formData, is_active: c })}
                                />
                            </div>
                        </div>
                    </div>

                    <Separator className="bg-white/5" />

                    {/* Pricing */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-neutral-500 uppercase flex items-center gap-2">
                            <DollarSign className="size-3.5" /> Monetization
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2 relative">
                                <Label className="text-xs font-mono text-neutral-400">UNIT_PRICE <span className="text-red-500">*</span></Label>
                                <Input
                                    type="number"
                                    value={formData.price ?? ''}
                                    onChange={(e) => {
                                        const val = parseFloat(e.target.value);
                                        setFormData({ ...formData, price: isNaN(val) ? 0 : val });
                                    }}
                                    className="bg-white/5 border-white/10 text-white font-mono pl-8"
                                />
                                <span className="absolute left-3 top-[29px] text-neutral-500 text-xs">€</span>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-mono text-neutral-400">FREQUENCY <span className="text-red-500">*</span></Label>
                                <Select
                                    value={formData.frequency}
                                    onValueChange={(v) => setFormData({ ...formData, frequency: v })}
                                >
                                    <SelectTrigger className="bg-white/5 border-white/10 text-white h-10">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-neutral-900 border-white/10 text-white">
                                        <SelectItem value="free">Free / Lifetime</SelectItem>
                                        <SelectItem value="daily">Daily</SelectItem>
                                        <SelectItem value="weekly">Weekly</SelectItem>
                                        <SelectItem value="monthly">Monthly</SelectItem>
                                        <SelectItem value="yearly">Yearly</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <Separator className="bg-white/5" />

                    {/* Promotional Application */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-bold text-neutral-500 uppercase flex items-center gap-2">
                                <Percent className="size-3.5" /> Promotional Application
                            </h3>
                            <Switch
                                checked={!!formData.promo}
                                onCheckedChange={(checked) => {
                                    if (checked) {
                                        setFormData({
                                            ...formData,
                                            promo: { price: formData.price ? Math.floor(formData.price * 0.8) : 0, savings: '20% OFF', duration: 'Limited Time' }
                                        });
                                    } else {
                                        setFormData({ ...formData, promo: null });
                                    }
                                }}
                            />
                        </div>

                        {formData.promo && (
                            <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 animate-in slide-in-from-top-2">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-mono text-amber-500/70">PROMO_PRICE</Label>
                                    <Input
                                        type="number"
                                        value={formData.promo?.price ?? ''}
                                        onChange={(e) => {
                                            const val = parseFloat(e.target.value);
                                            setFormData({
                                                ...formData,
                                                promo: { ...formData.promo!, price: isNaN(val) ? 0 : val }
                                            })
                                        }}
                                        className="bg-black/50 border-amber-500/20 text-amber-500 font-bold h-8 text-xs"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-mono text-amber-500/70">SAVINGS_TAG</Label>
                                    <Input
                                        value={formData.promo.savings}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            promo: { ...formData.promo!, savings: e.target.value }
                                        })}
                                        className="bg-black/50 border-amber-500/20 text-amber-500 font-bold h-8 text-xs"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-mono text-amber-500/70">DURATION</Label>
                                    <Input
                                        value={formData.promo.duration}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            promo: { ...formData.promo!, duration: e.target.value }
                                        })}
                                        className="bg-black/50 border-amber-500/20 text-amber-500 font-bold h-8 text-xs"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <Separator className="bg-white/5" />

                    {/* Features Editor */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-neutral-500 uppercase flex items-center gap-2">
                            <Star className="size-3.5" /> Feature Configuration
                        </h3>

                        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as keyof PlanFeatures)} className="w-full">
                            <TabsList className="w-full bg-white/5 border border-white/10 p-1 mb-4 h-9">
                                <TabsTrigger value="core" className="flex-1 text-xs h-7 data-[state=active]:bg-neutral-800">CORE</TabsTrigger>
                                <TabsTrigger value="advanced" className="flex-1 text-xs h-7 data-[state=active]:bg-neutral-800">ADVANCED</TabsTrigger>
                                <TabsTrigger value="vip" className="flex-1 text-xs h-7 data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-500">VIP</TabsTrigger>
                            </TabsList>

                            {(['core', 'advanced', 'vip'] as const).map(category => (
                                <TabsContent key={category} value={category} className="space-y-3">
                                    {formData.features?.[category] && Object.entries(formData.features[category]).map(([key, value]) => {
                                        const def = definitions.find(d => d.id === key);
                                        const label = def?.label || key;

                                        // Determine value type
                                        const isBoolean = typeof value === 'boolean' || (typeof value === 'object' && typeof (value as any).value === 'boolean');
                                        const stringValue = typeof value === 'object' ? (value as any).value : value;

                                        return (
                                            <div key={key} className="flex items-center gap-3 p-2 rounded-lg bg-white/5 border border-white/5 group">
                                                <div className="flex-1">
                                                    <p className="text-xs font-bold text-neutral-300">{label}</p>
                                                    <p className="text-[10px] text-neutral-500 font-mono">{key}</p>
                                                </div>

                                                {/* Edit Control */}
                                                {def?.type === 'boolean' ? (
                                                    <Switch
                                                        checked={stringValue as boolean}
                                                        onCheckedChange={(c) => updateFeature(category, key, c)}
                                                    />
                                                ) : (
                                                    <Input
                                                        value={stringValue as string}
                                                        onChange={(e) => updateFeature(category, key, e.target.value)}
                                                        className="h-7 w-24 text-xs bg-black/50 border-white/10"
                                                    />
                                                )}

                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => removeFeature(category, key)}
                                                    className="h-7 w-7 text-neutral-600 hover:text-red-500 hover:bg-red-500/10"
                                                >
                                                    <Archive className="size-3.5" />
                                                </Button>
                                            </div>
                                        );
                                    })}

                                    {/* Add Feature */}
                                    <div className="mt-4 pt-2 border-t border-dashed border-white/10">
                                        <Select onValueChange={(v) => addFeature(category, v)}>
                                            <SelectTrigger className="w-full h-8 text-xs bg-white/5 border-white/10 text-neutral-400 hover:text-white">
                                                <SelectValue placeholder="+ Add Feature Module" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-neutral-900 border-white/10 max-h-60">
                                                {definitions
                                                    .filter(d => !formData.features?.[category]?.[d.id])
                                                    .map(def => (
                                                        <SelectItem key={def.id} value={def.id} className="text-xs">
                                                            {def.label}
                                                        </SelectItem>
                                                    ))
                                                }
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </TabsContent>
                            ))}
                        </Tabs>
                    </div>

                    <Separator className="bg-white/5" />

                </div>

                <div className="p-4 border-t border-white/10 bg-black/90 backdrop-blur-md flex gap-3 flex-shrink-0">
                    <Button variant="ghost" className="flex-1 text-neutral-400 hover:text-white hover:bg-white/5" onClick={onClose}>
                        CANCEL
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={isLoading || !isFormValid}
                        className={cn("flex-1 text-black font-bold trigger-flash", isCreating ? "bg-emerald-500 hover:bg-emerald-600" : "bg-amber-500 hover:bg-amber-600")}
                    >
                        {isLoading ? <Loader2 className="size-4 mr-2 animate-spin" /> : isCreating ? <Rocket className="size-4 mr-2" /> : <Save className="size-4 mr-2" />}
                        {isLoading ? "PROCESSING..." : isCreating ? "INITIALIZE DROP" : "DEPLOY PATCH"}
                    </Button>
                </div>

            </SheetContent>
        </Sheet>
    );
}
