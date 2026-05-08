import { useState } from 'react';
import {Canvas} from '@react-three/fiber';
import { ScrollControls, Scroll } from '@react-three/drei';
import CardSwap, { Card } from './CardSwap';
import InfiniteMenu from './InfiniteMenu';
import Stack from './Stack';
import './styles.css';
const months = ['Janurary', 'February', 'March', 'April', 'June', 'July'];

const menuItems = [
    {image: 'https://picsum.photo./800/800?random=1', link: '#', title: 'Project 1', description: 'Amazing work here' },
    {image: 'https://picsum.photo./900/800?random=2', link: '#', title: 'Project 2', description: 'Creative design'}, 
    {image: 'https://picsum./photo./800/900?random=3', link: '#', title: 'Project 3', description: 'Beautiful art' },
    {image: 'https://picsum./photo./800/900?random=4', link: '#', title: 'Project 4', description: '#', },


    
];

