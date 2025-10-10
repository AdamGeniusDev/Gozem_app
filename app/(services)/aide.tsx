import { Image, Pressable, ScrollView, Text, View } from 'react-native'
import React from 'react'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { images } from '@/constants';
import { router } from 'expo-router';

const Aide = () => {
  const insets = useSafeAreaInsets();

  const sections = [
  {
    title: "Généralités sur Gozem",
    items: [
      "Qu'est-ce que Gozem ?",
      "Adresses des bureaux Gozem par pays",
      "Contacts du service client de Gozem",
      "Comment et où je télécharge l'application pour m'inscrire ?",
      "Comment je fais en cas de non réception de code d'activation ou OTP",
    ],
  },
  {
    title: "Gozem transport",
    items: [
      "Comment remonter une situation qui concerne une course en particulier",
      "J'ai oublié un objet après ma course ? Voici comment le récupérer facilement...",
      "Que faire si mon champion tarde à venir me chercher ?",
      "En cas d'accident (ce que nous ne souhaitons pas)",
      "Quel est le nombre de passagers par véhicule par voyage ?",
    ],
  },
  {
    title: "Gozem Ecommerce",
    items: [
      "Comment devenir un marchand sur l'application Gozem ?",
      "Que faire si ma commande est en retard ?",
      "Que faire si ma commande est endommagée ou perdue ? non conforme ou partiellement livrée ?",
      "Puis-je commander et faire livrer à une adresse différente de la mienne ?",
      "Comment suivre ma commande en temps réel ?",
    ],
  },
  {
    title: "Gozem coursier",
    items: [
      "Devenir coursier Gozem",
      "Délais et garanties de livraison",
      "Types de colis acceptés et interdits",
      "Tarification et modes de paiement",
      "Comment passer une commande avec Gozem Coursier ?",
    ],
  },
  {
    title: "Moyen de Paiement",
    items: [
      "Qu'est-ce qu'une majoration ?",
      "Comment je peux payer le champion Gozem une fois arrivé à destination ?",
      "Comment recharger mon portefeuille Gozem ?",
      "Comment marche mon portefeuille Gozem ?",
    ],
  },
  {
    title: "L'application Gozem",
    items: [
      "Comment parrainer un nouvel utilisateur ?",
      "Comment retrouver mes notifications Gozem ?",
      "J'aimerais donner mon avis sur un champion, je fais comment ?",
      "Comment retrouver l'historique de mes courses avec Gozem ?",
      "Est-ce que je peux voir le prix de la course sans commander un champion ?",
      "Est-ce que je peux voir le prix de la course sans commander un champion ?",
      "Qu'est-ce que les autorisations d'applications ?",
      "J'aimerais commander plusieurs champions Gozem, je fais comment ?",
    ],
  },
  {
    title: "Paramètres du Compte",
    items: [
      "Comment changer une photo de profil sur Gozem ?",
      "Comment changer mon nom d'utilisateur sur Gozem ?",
      "On a volé mon téléphone, comment je fais pour mon compte ?",
      "J'aimerais changer de numéro, comment je fais ?",
    ],
  },
  {
    title: "Collaborer avec Nous",
    items: [
      "Je voudrais proposer une opportunité de partenariat, comment puis-je le faire ?",
      "J'aimerais devenir champion, je dois aller où ?",
      "J'aimerais travailler pour Gozem, comment puis-je postuler ?",
    ],
  },
];
  return (
      <SafeAreaView edges={['left','right','top']} className=' bg-primary-300 flex-1 w-full'
      style={{paddingTop: insets.top}}
      >
      <View className='flex-row px-3 gap-x-5 items-center w-full'>
        <Pressable onPress={()=>router.back()} hitSlop={10}>
        <Image source={images.back} className='w-6 h-6' resizeMode='contain' tintColor={'#ffffff'}/>
        </Pressable>
        <View className='flex-row justify-between items-center px-2'style={{width: '75%'}}>
          <Text className='text-white text-[20px] font-poppins-bold'>Assistance</Text>
          <Pressable>
            <Image source={images.search} className='w-6 h-6' resizeMode='contain' tintColor={'#fff'}/>
          </Pressable>
        </View>
        <Pressable>
          <Image source={images.params} className='w-6 h-6' resizeMode='contain' tintColor={'#ffffff'}/>
        </Pressable>
      </View>

      <ScrollView className='flex-1 bg-white mt-3 px-3 pt-5'>
         {sections.map((sec) => (
        <View key={sec.title} className="mb-5">
          <Text className="text-[13px] text-neutral-500 font-semibold mb-2">{sec.title}</Text>
          {sec.items.map((it, idx) => (
            <Text key={`${sec.title}-${idx}`} className="text-[15px] font-regular leading-[35px] mb-1">
              • {it}
            </Text>
          ))}
        </View>
      ))}
      </ScrollView>

      <View className='w-[60px] h-[60px] bg-primary-300  rounded-full items-center justify-center elevation-5' style={{position:'absolute',bottom: 60,right: 20}}>
        <Image source={images.talk} style={{width: '50%',height:'50%'}} tintColor={'#fff'}/>
      </View>
    </SafeAreaView>
    
  )
}

export default Aide