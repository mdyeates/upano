"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import {
  AnimatePresence,
  motion,
  MotionConfig,
  type Variants,
} from "motion/react";
import { type ReactNode, useMemo, useState } from "react";
import {
  type DefaultValues,
  type FieldValues,
  type Path,
  type Resolver,
  type SubmitHandler,
  type UseFormReturn,
  useForm,
  FormProvider as Form,
} from "react-hook-form";
import useMeasure from "react-use-measure";
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import type { ZodType } from "zod";

import { Button } from "~/components/ui/button";
import { SaveButton } from "~/components/uselayouts/save-button";
import { Calendar } from "~/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { cn } from "~/lib/utils/utils";

export type MultiStepFormStep<TValues extends FieldValues> = {
  title: string;
  description: string;
  render: (form: UseFormReturn<TValues>) => ReactNode;
  fieldsToValidate?: Array<Path<TValues>>;
};

export type MultiStepFormProps<TValues extends FieldValues> = {
  schema: ZodType<TValues>;
  defaultValues: DefaultValues<TValues>;
  steps: Array<MultiStepFormStep<TValues>>;
  onSubmit: SubmitHandler<TValues>;
  onStepChange?: (step: number) => void;
  labels?: {
    back?: string;
    continue?: string;
    finish?: string;
  };
  submitting?: boolean;
  className?: string;
  formError?: string | null;
};

export function MultiStepForm<TValues extends FieldValues>({
  schema,
  defaultValues,
  steps,
  onSubmit,
  onStepChange,
  labels,
  submitting = false,
  className,
}: MultiStepFormProps<TValues>) {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(0);
  const [ref, bounds] = useMeasure();

  const form = useForm<TValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema as any) as unknown as Resolver<TValues>,
    defaultValues,
  });

  const isLast = currentStep === steps.length - 1;

  const variants: Variants = useMemo(
    () => ({
      initial: (dir: number) => ({ x: `${110 * dir}%`, opacity: 0 }),
      animate: { x: "0%", opacity: 1 },
      exit: (dir: number) => ({ x: `${-110 * dir}%`, opacity: 0 }),
    }),
    [],
  );

  const handleNext = async () => {
    const step = steps[currentStep];
    const fields = step.fieldsToValidate;
    if (fields && fields.length > 0) {
      const ok = await form.trigger(fields);
      if (!ok) return;
    } else if (fields === undefined) {
      const ok = await form.trigger();
      if (!ok) return;
    }

    if (isLast) {
      await form.handleSubmit(onSubmit as SubmitHandler<FieldValues>)();
      return;
    }
    setDirection(1);
    setCurrentStep((p) => {
      const next = p + 1;
      onStepChange?.(next);
      return next;
    });
  };

  const handlePrev = () => {
    if (currentStep === 0) return;
    setDirection(-1);
    setCurrentStep((p) => {
      const next = p - 1;
      onStepChange?.(next);
      return next;
    });
  };

  const step = steps[currentStep];

  return (
    <Form {...form}>
      <MotionConfig transition={{ duration: 0.5, type: "spring", bounce: 0 }}>
        <div
          className={cn(
            "flex w-full items-center justify-center bg-muted/10 p-4",
            className,
          )}
        >
          <Card className="w-full max-w-xl overflow-hidden border bg-background shadow-none">
            <motion.div layout>
              <CardHeader className="flex flex-row items-start justify-between space-y-0 px-6 py-4">
                <div className="flex flex-col gap-1">
                  <CardTitle className="text-xl">{step.title}</CardTitle>
                  <CardDescription>{step.description}</CardDescription>
                </div>
                <div className="flex items-center gap-1.5 pt-1">
                  {steps.map((_, index) => (
                    <div
                      key={`step-indicator-${index}`}
                      className={cn(
                        "h-2 rounded-full transition-all duration-300",
                        currentStep === index
                          ? "w-8 bg-primary"
                          : "w-2 bg-primary/20",
                      )}
                    />
                  ))}
                </div>
              </CardHeader>

              <motion.div
                animate={{ height: bounds.height > 0 ? bounds.height : "auto" }}
                className="relative overflow-hidden"
                transition={{ type: "spring", bounce: 0, duration: 0.5 }}
              >
                <div ref={ref}>
                  <CardContent className="relative px-6 py-2">
                    <AnimatePresence
                      mode="popLayout"
                      initial={false}
                      custom={direction}
                    >
                      <motion.div
                        key={currentStep}
                        variants={variants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        custom={direction}
                        className="w-full"
                      >
                        <div className="space-y-6 py-4">
                          {step.render(form as UseFormReturn<TValues>)}
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  </CardContent>
                </div>
              </motion.div>

              <CardFooter className="flex items-center justify-between border-t py-4">
                {steps.length > 1 ? (
                  <Button
                    variant="outline"
                    size="pill"
                    type="button"
                    onClick={handlePrev}
                    disabled={currentStep === 0}
                  >
                    <ChevronLeftIcon className="size-4" />
                    {labels?.back ?? "Back"}
                  </Button>
                ) : (
                  <span aria-hidden />
                )}
                {isLast ? (
                  <SaveButton
                    type="button"
                    state={submitting ? "loading" : "idle"}
                    onSave={async () => handleNext()}
                    labels={{
                      idle: labels?.finish,
                      loading: "Loading",
                      success: "Successful",
                    }}
                  />
                ) : (
                  <Button type="button" size="pill" onClick={handleNext}>
                    {labels?.continue ?? "Continue"}
                    <ChevronRightIcon className="size-4" />
                  </Button>
                )}
              </CardFooter>
            </motion.div>
          </Card>
        </div>
      </MotionConfig>
    </Form>
  );
}

export function DateField({
  value,
  onChange,
  placeholder = "Pick a date",
}: {
  value?: Date;
  onChange: (next: Date | undefined) => void;
  placeholder?: string;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
          )}
        >
          <CalendarIcon className="mr-2 size-4" />
          {value ? format(value, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={value} onSelect={onChange} />
      </PopoverContent>
    </Popover>
  );
}
