import Head from "next/head";
import { Box, Button, Heading, HStack, Img, Input, InputGroup, InputRightElement, VStack, Text, StackDivider, useToast, CircularProgress } from "@chakra-ui/react";
import { AiFillPlusCircle } from "react-icons/ai";
import { FaTelegramPlane } from "react-icons/fa";
import { BsThreeDotsVertical } from "react-icons/bs";
import io, { Socket } from "socket.io-client";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export interface ILoggedInData {
  connected?: boolean;
  username: string;
  token: string;
}

interface IMessage {
  content: string;
  fromSelf: boolean;
}

export interface IUserData {
  username: string;
  userID: string;
}

export interface IUser extends IUserData {
  connected: boolean;
  messages: Array<IMessage>;
  hasNewMessages: boolean;
  self: boolean;
}

let socket: Socket;

export default function Chat() {
  const toast = useToast();
  const [csr, setCsr] = useState(false);
  const router = useRouter();
  const [selectedChat, setSelectedChat] = useState<string>();
  const [message, setMessage] = useState("");
  const [loggedInUser, setLoggedInUser] = useState<ILoggedInData>();
  const [users, setUsers] = useState<IUser[]>([]);

  useEffect(() => {
    if (localStorage.getItem("user")) setLoggedInUser(JSON.parse(localStorage.getItem("user")!));
    else router.push("/login");
    setCsr(true);

    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (csr) socketInitializer();
  }, [csr]);

  const initReactiveProperties = () => ({
    connected: true,
    messages: [],
    hasNewMessages: false,
  });

  async function socketInitializer() {
    socket = io("http://localhost:4040", { autoConnect: false });
    socket.auth = {
      user: loggedInUser,
    };
    socket.connect();

    socket.on("connect", () => {
      toast({
        title: "Notification.",
        // another pending description: "User with name \"lorem\" has been logged out"?
        description: "Connection to websocket server has been established.",
        status: "success",
        duration: 9000,
        isClosable: true,
      });
      setLoggedInUser((user) => user && { ...user, connected: true });
    });

    socket.onAny((event, ...args) => {
      console.log(event, args);
    });

    socket.on("disconnect", () => {
      setLoggedInUser((user) => user && { ...user, connected: false });
    });

    socket.on("user disconnected", (id) => {
      setUsers((currUsers) => {
        return currUsers.map((user) => {
          if (user.userID === id) return { ...user, connected: false };
          else return user;
        });
      });
    });

    socket.on("user connected", (incomingUser: IUserData) => {
      setUsers((currUsers) => [
        ...currUsers,
        {
          ...incomingUser,
          ...initReactiveProperties(),
          self: false,
        },
      ]);
    });
    socket.on("users", (users: IUserData[]) => {
      setUsers((currUsers) => [
        ...currUsers,
        ...users.map((user) => ({
          ...user,
          ...initReactiveProperties(),
          self: user.userID === socket.id,
        })),
      ]);
    });

    socket.on("private message", ({ content, from }: Record<string, string>) => {
      setUsers((currUsers) => {
        return currUsers.map((user) => {
          if (user.userID === from) {
            user.messages = [
              ...user.messages,
              {
                content,
                fromSelf: false,
              },
            ];
            if (user.userID !== selectedChat) user.hasNewMessages = true;
            return user;
          } else {
            return user;
          }
        });
      });
    });

    socket.on("connect_error", (err) => {
      console.error(err);
      toast({
        title: "Notification.",
        description: "Connection lost. Please try again later.",
        status: "error",
        duration: 9000,
        isClosable: true,
      });
    });
  }

  const sendMessage = () => {
    socket.emit("private message", {
      content: message,
      to: selectedChat,
    });
    setUsers((currUsers) => [
      ...currUsers.map((user) => {
        if (user.userID === selectedChat) {
          return {
            ...user,
            messages: [
              ...user.messages,
              {
                content: message,
                fromSelf: true,
              },
            ],
          };
        }
        return user;
      }),
    ]);
    setMessage("");
  };

  const handleKeypress: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter" && message) {
      e.preventDefault();
      sendMessage();
    }
  };
  const handleSubmitText: React.MouseEventHandler<SVGElement> = (e) => {
    if (message) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      <Head>
        <title>FaSock chat-app</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <HStack spacing="0" alignItems="stretch" maxH="full" h="100vh" overflow="hidden" divider={<StackDivider borderColor="#2C323D" />}>
        <VStack spacing="0" as="nav" w="md" alignItems="stretch">
          <HStack p="3" gap="1" justifyContent="space-between">
            <HStack>
              <Img src="/profile.jpg" width={45} height={45} borderRadius="full" />
              <VStack spacing="0" alignItems="start">
                <Heading fontSize="lg">{loggedInUser?.username ?? "Unauthenticated"}</Heading>
                <Text>{loggedInUser?.connected ? "Online" : "Offline"}</Text>
              </VStack>
            </HStack>
            <BsThreeDotsVertical cursor="pointer" />
          </HStack>
          <Button rightIcon={<AiFillPlusCircle />} py="4" rounded="none" fontSize="lg">
            Create New Group
          </Button>
          <VStack spacing="0" divider={<StackDivider borderColor="#2C323D" />} alignItems="stretch" overflow="auto">
            {users
              ?.filter((user) => !user.self)
              .map((user, i) =>
                selectedChat ? (
                  <Box display="flex" alignItems="start" justifyContent="space-between" px="5" py="3" gap="3" bg="#2b3942">
                    <Img src="user.jpg" w={45} borderRadius="full" />
                    <VStack flex={1} alignItems="start" spacing="0">
                      <Heading fontSize="lg">{user.username}</Heading>
                      <Text>
                        {user.messages.pop()?.content} - {user.hasNewMessages ?? "i"}
                      </Text>
                    </VStack>
                    {/* last message timestamp */}
                    <Text alignSelf="start">10.45</Text>
                  </Box>
                ) : (
                  <Box key={i} display="flex" alignItems="center" px="5" py="3" gap="3" _hover={{ bg: "#2c323d", borderY: "1px", borderColor: "#1a202c", cursor: "pointer" }} onClick={() => setSelectedChat(user.userID)}>
                    <Img src="user.jpg" w={45} borderRadius="full" />
                    <Heading fontSize="lg">
                      <CircularProgress value={100} color={`${user.connected ? "green" : "red"}.400`} size="15px" thickness="30px" /> {user.username}
                    </Heading>
                  </Box>
                )
              )}
          </VStack>
        </VStack>
        {selectedChat ? (
          <VStack spacing="0" flexGrow={1} pb="1" alignItems="stretch">
            <HStack p="3" gap="1">
              <Img src="user.jpg" width={45} height={45} borderRadius="full" />
              <Heading fontSize="lg">{users.find((user) => user.userID === selectedChat)?.username}</Heading>
            </HStack>
            <VStack bg="#2C323D" flex={1} p="5" overflow="auto">
              {users
                .find((user) => user.userID === selectedChat)
                ?.messages.map((message, i) => {
                  return (
                    <Text key={i} bg="ThreeDDarkShadow" rounded="md" p="2" alignSelf={message.fromSelf ? "end" : "start"} maxW="45%">
                      {message.content}
                    </Text>
                  );
                })}
            </VStack>
            <InputGroup>
              <Input px="3" variant="flushed" placeholder="Enter new message..." value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={handleKeypress} />
              <InputRightElement cursor="pointer" children={<FaTelegramPlane onClick={handleSubmitText} />} />
            </InputGroup>
          </VStack>
        ) : (
          <VStack flexGrow={1} pb="1" alignItems="center" justifyContent="center" direction="row">
            <Box>
              <Heading>Select chat-box to start new conversation!</Heading>
            </Box>
          </VStack>
        )}
      </HStack>
    </>
  );
}
