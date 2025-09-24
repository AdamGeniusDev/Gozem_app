import React from "react";
import { Pressable, Text, PressableProps } from "react-native";

interface CustomButtonProps extends PressableProps {
  titre: string;
  disabled?: boolean;
  bg?: string;
}

const CustomButton = ({ titre, disabled = false,bg='bg-primary-400',...props }: CustomButtonProps) => {
  return (
    <Pressable
      className={`w-full mb-3 py-2 mx-5 rounded-full ${
        disabled ? "bg-neutral-200" : `${bg}`
      }`}
      disabled={disabled} 
      {...props} //comment on passe le reste des props
    >
      <Text className={`font-extra text-center text-[16px] ${disabled ? "text-neutral-400" : "text-white"}`}>
        {titre}
      </Text>
    </Pressable>
  );
};

export default CustomButton;
