import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

type AddExpenseFormProps = {
  isSaving: boolean;
  onSubmit: (input: { payerName: string; amount: number; description: string }) => Promise<void>;
};

export function AddExpenseForm({ isSaving, onSubmit }: AddExpenseFormProps) {
  const [payerName, setPayerName] = useState("");
  const [amountText, setAmountText] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!payerName.trim()) {
      setError("Payer name is required");
      return;
    }
    const amount = Number.parseFloat(amountText.replace(",", "."));
    if (Number.isNaN(amount) || amount <= 0) {
      setError("Enter a valid amount greater than 0");
      return;
    }
    setError(null);
    await onSubmit({
      payerName: payerName.trim(),
      amount,
      description: description.trim(),
    });
    setAmountText("");
    setDescription("");
  };

  return (
    <View className="rounded-2xl border border-zinc-200 bg-white p-4">
      <Text className="text-lg font-semibold text-zinc-900">Add expense</Text>

      <TextInput
        value={payerName}
        onChangeText={setPayerName}
        placeholder="Payer"
        autoCapitalize="words"
        className="mt-3 rounded-xl border border-zinc-300 px-3 py-3 text-zinc-900"
      />

      <TextInput
        value={amountText}
        onChangeText={setAmountText}
        placeholder="Amount"
        keyboardType="decimal-pad"
        className="mt-3 rounded-xl border border-zinc-300 px-3 py-3 text-zinc-900"
      />

      <TextInput
        value={description}
        onChangeText={setDescription}
        placeholder="Description"
        className="mt-3 rounded-xl border border-zinc-300 px-3 py-3 text-zinc-900"
      />

      {error ? <Text className="mt-2 text-red-600">{error}</Text> : null}

      <Pressable
        onPress={() => void handleSubmit()}
        disabled={isSaving}
        className="mt-4 items-center rounded-xl bg-zinc-900 py-3"
      >
        <Text className="font-semibold text-white">{isSaving ? "Saving..." : "Save expense"}</Text>
      </Pressable>
    </View>
  );
}
