import React from 'react';
import { TextInput, TextInputProps, StyleSheet } from 'react-native';

/**
 * Custom TextInput component with improved readability
 * Uses system default font with larger size and better letter spacing
 */
export const CustomTextInput = React.forwardRef<TextInput, TextInputProps>((props, ref) => {
  const { style, ...restProps } = props;

  return (
    <TextInput
      ref={ref}
      {...restProps}
      style={[styles.defaultStyle, style]}
    />
  );
});

const styles = StyleSheet.create({
  defaultStyle: {
    fontSize: 18, // Increased from default for better readability
    letterSpacing: 0.3, // Slight spacing for improved readability
  },
});

CustomTextInput.displayName = 'CustomTextInput';

