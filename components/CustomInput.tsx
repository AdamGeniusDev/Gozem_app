import { View, Image, TextInput, TextInputProps, ImageSourcePropType, Pressable } from 'react-native'
import React from 'react'

interface CustomInputProps extends TextInputProps{
    image: ImageSourcePropType,
    icon?:ImageSourcePropType,
    secureTextEntry?: boolean,
    onPress?: ()=>void
}

const CustomInput = ({image,icon,secureTextEntry=false,onPress,...props}: CustomInputProps) => {
  return (
    <View className=" px-3 h-[50] flex flex-row items-center bg-white rounded-xl border-2 border-neutral-300 gap-x-2">
        <Image source={image} className='h-[22] w-[22]' resizeMode='contain' style={{tintColor: '#B0B3B2'}}/>
        <TextInput
        {...props}
        secureTextEntry={secureTextEntry}
        className=" flex-1 font-regular text-[16px]"
        />
        {icon && (
          <Pressable onPress={onPress} hitSlop={15}>
            <Image source={icon} className='h-[12] w-[12]' resizeMode='contain' style={{tintColor: '#B0B3B2'}}/>
          </Pressable>
        )}
    </View>
  )
}

export default CustomInput