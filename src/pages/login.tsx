import { Button, Flex, FormControl, FormErrorMessage, FormLabel, Heading, Input, InputGroup, InputRightElement, Link, Text, VStack } from "@chakra-ui/react";
import Head from "next/head";
import NextLink from "next/link";
import { useState } from "react";
import { FiLogIn } from "react-icons/fi";

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);

  return (
    <>
      <Head>
        <title>Login</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Flex minH="100vh" h="full" justifyContent="center" alignItems="center">
        <VStack bg="ThreeDDarkShadow" p="4" rounded="md" maxW="90%" w="md">
          <Heading>Login Form</Heading>
          <FormControl isRequired>
            <FormLabel>Email address</FormLabel>
            <Input type="email" onChange={(e) => setEmail(e.target.value)} />
            {/* turn on error if on submit the email field is empty */}
            {email === "" && <FormErrorMessage>Email is required.</FormErrorMessage>}
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Password</FormLabel>
            <InputGroup size="md">
              <Input pr="4.5rem" type={show ? "text" : "password"} placeholder="Enter password" onChange={(e) => setPassword(e.target.value)} />
              <InputRightElement width="4.5rem">
                <Button h="1.75rem" size="sm" onClick={() => setShow(!show)}>
                  {show ? "Hide" : "Show"}
                </Button>
              </InputRightElement>
            </InputGroup>
          </FormControl>
          <Button leftIcon={<FiLogIn />} colorScheme="blue" variant="solid" alignSelf="stretch">
            Sign In
          </Button>
          <Text>
            Don't have an account?{" "}
            <Link as={NextLink} href="/register">
              Sign Up
            </Link>
          </Text>
        </VStack>
      </Flex>
    </>
  );
}
