import React from "react";
import { Pressable, Text, PressableProps } from "react-native";
import cn from 'clsx';

interface CustomButtonProps extends PressableProps {
  titre: string;
  disabled?: boolean;
  bg?: string;
  className?: string;
  textColor?: string;
}

const CustomButton = ({ titre, disabled = false, bg='bg-primary-400', className, textColor, ...props }: CustomButtonProps) => {
  return (
    <Pressable
      className={cn(
        "w-full mb-3 py-2 rounded-full",
        disabled ? "bg-neutral-200" : bg,
        className
      )}
      disabled={disabled} 
      {...props}
    >
      <Text className={cn(
        "font-extra text-center text-[16px]",
        textColor ? textColor : disabled ? "text-neutral-400" : "text-white"
      )}>
        {titre}
      </Text>
    </Pressable>
  );
};

export default CustomButton;